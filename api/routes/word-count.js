import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Create word count router
const wordCountRouter = new Hono();

/**
 * Get environment variable from multiple possible sources
 * Checks c.env (Cloudflare Workers), then process.env (Node.js)
 * Supports both prefixed (VITE_) and non-prefixed variants
 */
const getEnvVar = (c, varName, defaultValue = null) => {
	const value =
		c.env?.[varName] ||
		c.env?.[`VITE_${varName}`] ||
		process.env[varName] ||
		process.env[`VITE_${varName}`] ||
		defaultValue;
	return value;
};

// JWT verification middleware for protected API routes
const verifyJWT = async (c, next) => {
	const authHeader = c.req.header("Authorization");
	
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return Response.json(
			{ error: "Unauthorized. Missing or invalid Authorization header." },
			{ status: 401 }
		);
	}

	const token = authHeader.substring(7); // Remove "Bearer " prefix
	
	try {
		// Get Auth0 configuration from environment
		const auth0Domain = getEnvVar(c, "AUTH0_DOMAIN");
		const auth0Audience = getEnvVar(
			c,
			"AUTH0_AUDIENCE",
			"https://wrimo.io/api/"
		);
		
		if (!auth0Domain) {
			console.error("Auth0 domain not found. Available env vars:", Object.keys(c.env || {}));
			throw new Error(
				"Auth0 domain not configured.\n" +
				"Create a .dev.vars file (see .dev.vars.example) with:\n" +
				"  AUTH0_DOMAIN=join.wrimo.io\n" +
				"  AUTH0_AUDIENCE=https://wrimo.io/api/\n" +
				"\nNote: .env files are NOT loaded into c.env by Cloudflare Workers.\n" +
				"Use .dev.vars for backend environment variables (it's gitignored)."
			);
		}

		// Construct JWKS URL and create JWKS set
		const jwksUrl = `https://${auth0Domain}/.well-known/jwks.json`;
		const JWKS = createRemoteJWKSet(new URL(jwksUrl));
		
		// Verify the JWT token
		const { payload } = await jwtVerify(token, JWKS, {
			issuer: `https://${auth0Domain}/`,
			audience: auth0Audience,
		});
		
		// Store JWT payload (including custom claims) in context for use in route handlers
		// The UUID from app_metadata.uuid is added as a custom claim: https://wrimo.io/claims/uuid
		c.set("user", payload);
	} catch (error) {
		console.error("JWT verification failed:", error);
		return Response.json(
			{ error: "Unauthorized. Invalid or expired token." },
			{ status: 401 }
		);
	}
	
	// Call next() outside the try-catch so route handler errors aren't caught
	await next();
};

// Apply JWT verification middleware to all routes
wordCountRouter.use("/*", verifyJWT);

/**
 * Extract user_id from app_metadata.uuid custom claim in the JWT token payload
 * The UUID is added by Auth0 Action as: https://wrimo.io/claims/uuid
 * @param {object} jwtPayload - The JWT token payload
 * @param {string} token - The access token (for fallback to fetch userinfo if needed)
 * @param {string} auth0Domain - Auth0 domain (for fallback)
 * @returns {Promise<string|null>} - The user_id UUID or null if not found
 */
const extractUserId = async (jwtPayload, token = null, auth0Domain = null) => {
	if (!jwtPayload) {
		return null;
	}

	// Extract UUID from custom claim added by Auth0 Action
	// The namespace is: https://wrimo.io/claims/uuid
	// This corresponds to app_metadata.uuid in Auth0
	const claimNamespace = "https://wrimo.io/claims/uuid";
	const uuid = jwtPayload[claimNamespace];
	
	if (uuid) {
		return uuid;
	}
	
	// Debug: Log available keys to help troubleshoot
	console.log("JWT payload keys:", Object.keys(jwtPayload));
	console.log("Looking for claim:", claimNamespace);
	console.log("Available custom claims:", Object.keys(jwtPayload).filter(key => key.startsWith("https://")));
	
	// Note: /userinfo doesn't return app_metadata, only user_metadata
	// So we can't fetch it via userinfo endpoint
	// The custom claim must be added by the Auth0 Action
	
	return null;
};

// GET endpoint to retrieve user's word count updates
wordCountRouter.get("/", async (c) => {
	const sql = c.env.SQL;
	const user = c.get("user");

	if (!user) {
		return Response.json(
			{ error: "User information not found in token." },
			{ status: 401 }
		);
	}

	const auth0Domain = getEnvVar(c, "AUTH0_DOMAIN");
	const authHeader = c.req.header("Authorization");
	const token = authHeader?.substring(7); // Extract token for potential fallback
	
	const userId = await extractUserId(user, token, auth0Domain);
	if (!userId) {
		const availableKeys = Object.keys(user || {});
		const customClaims = availableKeys.filter(key => key.startsWith("https://"));
		console.error("app_metadata.uuid not found in token.");
		console.error("Available keys:", availableKeys);
		console.error("Custom claims found:", customClaims);
		console.error("Full payload:", JSON.stringify(user, null, 2));
		console.error("Token audience:", user?.aud);
		console.error("Expected claim namespace: https://wrimo.io/claims/uuid");
		
		return Response.json(
			{ 
				error: "User UUID not found in access token. The Auth0 Action custom claim is missing.",
				debug: {
					availableKeys,
					customClaims,
					expectedClaim: "https://wrimo.io/claims/uuid",
					tokenAudience: user?.aud,
					troubleshooting: [
						"1. Go to Auth0 Dashboard > Actions > Flows > PostLogin and verify your Action is attached",
						"2. Check Action execution logs: Actions > [Your Action] > Logs to see if it's running",
						"3. Verify the Action code includes: api.accessToken.setCustomClaim('https://wrimo.io/claims/uuid', uuid)",
						"4. Ensure the Action is DEPLOYED (not just saved) - click 'Deploy' button",
						"5. The token audience is correct: " + JSON.stringify(user?.aud),
						"6. IMPORTANT: Log out completely and log back in to get a fresh token",
						"7. Verify app_metadata.uuid exists in Auth0: Dashboard > User Management > Users > [Your User] > Raw JSON",
						"8. If app_metadata.uuid doesn't exist, the Action should create it on first login"
					]
				}
			},
			{ status: 400 }
		);
	}

	try {
		const { start_date, end_date } = c.req.query();
		
		// Validate and parse dates if provided
		let startDate = null;
		let endDate = null;
		
		if (start_date) {
			startDate = new Date(start_date);
			if (isNaN(startDate.getTime())) {
				return Response.json(
					{ error: "Invalid start_date format. Use ISO 8601 format (e.g., 2025-01-01 or 2025-01-01T00:00:00Z)." },
					{ status: 400 }
				);
			}
		}
		
		if (end_date) {
			endDate = new Date(end_date);
			if (isNaN(endDate.getTime())) {
				return Response.json(
					{ error: "Invalid end_date format. Use ISO 8601 format (e.g., 2025-01-31 or 2025-01-31T23:59:59Z)." },
					{ status: 400 }
				);
			}
		}
		
		// Build query based on which filters are provided
		console.log("Query parameters:", { userId, startDate, endDate });
		let results;
		if (startDate && endDate) {
			// Both dates provided
			results = await sql`
				SELECT * FROM word_count_updates
				WHERE user_id = ${userId}::uuid
				AND created_at >= ${startDate}::timestamp with time zone
				AND created_at <= ${endDate}::timestamp with time zone
				ORDER BY created_at DESC
			`;
		} else if (startDate) {
			// Only start_date provided
			results = await sql`
				SELECT * FROM word_count_updates
				WHERE user_id = ${userId}::uuid
				AND created_at >= ${startDate}::timestamp with time zone
				ORDER BY created_at DESC
			`;
		} else if (endDate) {
			// Only end_date provided
			results = await sql`
				SELECT * FROM word_count_updates
				WHERE user_id = ${userId}::uuid
				AND created_at <= ${endDate}::timestamp with time zone
				ORDER BY created_at DESC
			`;
		} else {
			// No date filters
			results = await sql`
				SELECT * FROM word_count_updates
				WHERE user_id = ${userId}::uuid
				ORDER BY created_at DESC
			`;
		}
		
		return Response.json({
			success: true,
			word_count_updates: results,
			count: results.length,
		});
	} catch (error) {
		console.error("Error retrieving word count updates:", error);
		console.error("Error details:", {
			message: error.message,
			stack: error.stack,
			userId: userId,
		});
		return Response.json(
			{ 
				error: "Failed to retrieve word count updates. Please try again.",
				details: process.env.NODE_ENV === "development" ? error.message : undefined
			},
			{ status: 500 }
		);
	}
});

// POST endpoint to create a word count update
wordCountRouter.post("/", async (c) => {
	const sql = c.env.SQL;
	const user = c.get("user");

	if (!user) {
		return Response.json(
			{ error: "User information not found in token." },
			{ status: 401 }
		);
	}

	const auth0Domain = getEnvVar(c, "AUTH0_DOMAIN");
	const authHeader = c.req.header("Authorization");
	const token = authHeader?.substring(7); // Extract token for potential fallback
	
	const userId = await extractUserId(user, token, auth0Domain);
	if (!userId) {
		const availableKeys = Object.keys(user || {});
		const customClaims = availableKeys.filter(key => key.startsWith("https://"));
		console.error("app_metadata.uuid not found in token.");
		console.error("Available keys:", availableKeys);
		console.error("Custom claims found:", customClaims);
		console.error("Full payload:", JSON.stringify(user, null, 2));
		console.error("Token audience:", user?.aud);
		console.error("Expected claim namespace: https://wrimo.io/claims/uuid");
		
		return Response.json(
			{ 
				error: "User UUID not found in access token. The Auth0 Action custom claim is missing.",
				debug: {
					availableKeys,
					customClaims,
					expectedClaim: "https://wrimo.io/claims/uuid",
					tokenAudience: user?.aud,
					troubleshooting: [
						"1. Go to Auth0 Dashboard > Actions > Flows > PostLogin and verify your Action is attached",
						"2. Check Action execution logs: Actions > [Your Action] > Logs to see if it's running",
						"3. Verify the Action code includes: api.accessToken.setCustomClaim('https://wrimo.io/claims/uuid', uuid)",
						"4. Ensure the Action is DEPLOYED (not just saved) - click 'Deploy' button",
						"5. The token audience is correct: " + JSON.stringify(user?.aud),
						"6. IMPORTANT: Log out completely and log back in to get a fresh token",
						"7. Verify app_metadata.uuid exists in Auth0: Dashboard > User Management > Users > [Your User] > Raw JSON",
						"8. If app_metadata.uuid doesn't exist, the Action should create it on first login"
					]
				}
			},
			{ status: 400 }
		);
	}

	try {
		const body = await c.req.json();

		// Validate word_count
		if (!body.word_count || typeof body.word_count !== "number") {
			return Response.json(
				{ error: "word_count is required and must be a number." },
				{ status: 400 }
			);
		}

		if (body.word_count <= 0) {
			return Response.json(
				{ error: "word_count must be greater than 0." },
				{ status: 400 }
			);
		}

		// Insert word count update into database
		const result = await sql`
			INSERT INTO word_count_updates (user_id, created_at, word_count)
			VALUES (${userId}::uuid, CURRENT_TIMESTAMP, ${body.word_count})
			RETURNING *
		`;

		if (result.length === 0) {
			return Response.json(
				{ error: "Failed to create word count update." },
				{ status: 500 }
			);
		}

		return Response.json({
			success: true,
			word_count_update: result[0],
		}, { status: 201 });
	} catch (error) {
		console.error("Error creating word count update:", error);
		
		// Handle specific database errors
		if (error.message && error.message.includes("invalid input syntax for type uuid")) {
			return Response.json(
				{ error: "Invalid user ID format." },
				{ status: 400 }
			);
		}

		return Response.json(
			{ error: "Failed to create word count update. Please try again." },
			{ status: 500 }
		);
	}
});

export default wordCountRouter;

