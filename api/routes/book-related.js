import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Create book related router
const bookRelatedRouter = new Hono();

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
				"  AUTH0_DOMAIN=your-domain.auth0.com\n" +
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
		
		// Store user info in context for use in route handlers
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
bookRelatedRouter.use("/*", verifyJWT);

// Related books endpoint
bookRelatedRouter.get("/", async (c) => {
	const bookId = c.req.param("id");
	const sql = c.env.SQL;

	if (!bookId) {
		return Response.json({ error: "Book ID is required" }, { status: 400 });
	}

	const book = await sql`SELECT * FROM public.books WHERE id = ${bookId}`;

	if (book.length === 0) {
		return Response.json({ error: "Book not found" }, { status: 404 });
	}

	const bookGenre = book[0].genre;

	// Fetch related books, genre stats, and recent recommendations in parallel
	const [relatedBooks, genreCounts, recentBooks] = await Promise.all([
		sql`
			SELECT * FROM public.books 
			WHERE genre = ${bookGenre} AND id != ${bookId}
			LIMIT 3
		`,
		sql`
			SELECT genre, COUNT(*) as count 
			FROM public.books 
			GROUP BY genre 
			ORDER BY count DESC
		`,
		sql`
			SELECT * FROM public.books 
			WHERE id != ${bookId} 
			ORDER BY created_at DESC 
			LIMIT 2
		`,
	]);

	return Response.json({
		bookId,
		bookGenre,
		relatedBooks,
		recentRecommendations: recentBooks,
		genreStats: genreCounts,
		source: "database",
	});
});

export default bookRelatedRouter;
