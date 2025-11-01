import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App.jsx";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || "https://wrimo.io/api/";

// Validate Auth0 configuration
if (!domain || !clientId) {
	console.error("Auth0 configuration missing. Please check your .env file.");
	console.error("Required environment variables:");
	console.error("- VITE_AUTH0_DOMAIN");
	console.error("- VITE_AUTH0_CLIENT_ID");
	console.error("Optional (defaults to https://wrimo.io/api/):");
	console.error("- VITE_AUTH0_AUDIENCE");
	throw new Error("Auth0 domain and client ID must be set in .env file");
}

// Warn if audience is not explicitly set (using default)
if (!import.meta.env.VITE_AUTH0_AUDIENCE) {
	console.warn("VITE_AUTH0_AUDIENCE not set, using default: https://wrimo.io/api/");
}

// Validate domain format (optional warning)
// Note: Custom domains (e.g., join.wrimo.io) are also valid Auth0 domains
const isValidAuth0Domain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain);
if (!isValidAuth0Domain) {
	console.warn("Auth0 domain format might be incorrect. Expected format: your-domain.auth0.com or custom domain (e.g., join.wrimo.io)");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<Auth0Provider
			domain={domain}
			clientId={clientId}
			authorizationParams={{
				redirect_uri: window.location.origin,
				audience,
				scope: "openid profile email offline_access",
			}}
			cacheLocation="localstorage"
			useRefreshTokens={true}
		>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/genre/:genreId" element={<App />} />
					<Route path="/book/:bookId" element={<App />} />
				</Routes>
			</BrowserRouter>
		</Auth0Provider>
	</StrictMode>,
);
