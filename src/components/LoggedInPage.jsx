import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../LogoutButton";

export default function LoggedInPage() {
	const { getAccessTokenSilently, isAuthenticated } = useAuth0();
	const [totalWords, setTotalWords] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		const fetchWordCount = async () => {
			try {
				setLoading(true);
				setError(null);

				// Calculate start and end of current month
				const now = new Date();
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

				// Format dates as ISO 8601 strings
				const startDate = startOfMonth.toISOString();
				const endDate = endOfMonth.toISOString();

				// Get access token
				const token = await getAccessTokenSilently();

				// Fetch word count updates for this month
				const response = await fetch(
					`/api/word-count?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch word count: ${response.status}`);
				}

				const data = await response.json();

				// Calculate total words written this month
				// Sum all word_count values from the updates
				const total = data.word_count_updates?.reduce((sum, update) => sum + update.word_count, 0) || 0;
				setTotalWords(total);
			} catch (err) {
				console.error("Error fetching word count:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchWordCount();
	}, [isAuthenticated, getAccessTokenSilently]);

	return (
		<div className="logged-in-page">
			<header className="logged-in-header">
				<h1 className="logged-in-title">Wrimo</h1>
				<LogoutButton className="login-style" />
			</header>
			<div className="logged-in-container">
				{loading && <p>Loading...</p>}
				{error && <p className="error">Error: {error}</p>}
				{!loading && !error && (
					<p className="word-count-message">
						This month you wrote {totalWords?.toLocaleString() || 0} words.
					</p>
				)}
			</div>
		</div>
	);
}

