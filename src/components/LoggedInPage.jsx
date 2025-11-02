import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../LogoutButton";

export default function LoggedInPage() {
	const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
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

			// Calculate start and end of current month based on user's local calendar month
			// Fix: Avoid timezone conversion shift by using start of next month as exclusive boundary
			const now = new Date();
			const year = now.getFullYear();
			const month = now.getMonth(); // 0-11, represents user's current calendar month
			
			// Start of month: Local midnight on the 1st, converted to UTC
			const startOfMonthLocal = new Date(year, month, 1, 0, 0, 0, 0);
			const startDate = startOfMonthLocal.toISOString();
			
			// End of month: Use start of next month in local time, convert to UTC, subtract 1ms
			// This avoids the issue where Nov 30 23:59:59 EST -> Dec 1 04:59:59 UTC
			// By using Dec 1 00:00:00 EST -> Dec 1 05:00:00 UTC, then subtracting 1ms,
			// we get Dec 1 04:59:59.999 UTC, which correctly represents the end of November
			const startOfNextMonthLocal = new Date(year, month + 1, 1, 0, 0, 0, 0);
			const startOfNextMonthUTC = new Date(startOfNextMonthLocal.toISOString());
			const endOfMonthUTC = new Date(startOfNextMonthUTC.getTime() - 1);
			const endDate = endOfMonthUTC.toISOString();

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
				<div className="logged-in-title-container">
					<h1 className="logged-in-title">Wrimo</h1>
					{user?.name && (
						<span className="logged-in-user-name">
							{user.name}
						</span>
					)}
				</div>
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

