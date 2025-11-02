import { useAuth0 } from "@auth0/auth0-react";
import LandingPage from "./LandingPage";
import LoggedInPage from "./LoggedInPage";

export default function HomePage() {
	const { isAuthenticated, isLoading } = useAuth0();

	if (isLoading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
			</div>
		);
	}

	return isAuthenticated ? <LoggedInPage /> : <LandingPage />;
}

