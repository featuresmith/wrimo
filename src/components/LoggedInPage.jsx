import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../LogoutButton";

export default function LoggedInPage() {
	const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
	const [totalWords, setTotalWords] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [wordCountInput, setWordCountInput] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showLoadingText, setShowLoadingText] = useState(false);
	const [submitError, setSubmitError] = useState(null);
	const [submitSuccess, setSubmitSuccess] = useState(null);
	const [todayWordCount, setTodayWordCount] = useState(null);
	const loadingTimeoutRef = useRef(null);

	const fetchTodayWordCount = async () => {
		if (!isAuthenticated) {
			return;
		}

		try {
			// Calculate start and end of today in user's local timezone
			const now = new Date();
			const year = now.getFullYear();
			const month = now.getMonth();
			const day = now.getDate();
			
			// Start of today: Local midnight, converted to UTC
			const startOfTodayLocal = new Date(year, month, day, 0, 0, 0, 0);
			const startDate = startOfTodayLocal.toISOString();
			
			// End of today: Start of tomorrow in local time, convert to UTC, subtract 1ms
			const startOfTomorrowLocal = new Date(year, month, day + 1, 0, 0, 0, 0);
			const startOfTomorrowUTC = new Date(startOfTomorrowLocal.toISOString());
			const endOfTodayUTC = new Date(startOfTomorrowUTC.getTime() - 1);
			const endDate = endOfTodayUTC.toISOString();

			let token;
			try {
				token = await getAccessTokenSilently();
			} catch (tokenError) {
				console.error("Error getting access token for today's count:", tokenError);
				return; // Silently fail for today's count
			}

			if (!token) {
				return; // Silently fail for today's count
			}

			const response = await fetch(
				`/api/word-count?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				// Silently fail for today's count - it's not critical
				return;
			}

			const data = await response.json();

			// Sum all word_count values from today's updates
			const todayTotal = data.word_count_updates?.reduce((sum, update) => sum + update.word_count, 0) || 0;
			setTodayWordCount(todayTotal);
			
			// Prefill input if there are entries for today
			if (todayTotal > 0) {
				// Convert to integer to remove any leading zeros, then to string
				setWordCountInput(String(parseInt(todayTotal, 10)));
			}
		} catch (err) {
			console.error("Error fetching today's word count:", err);
			// Don't set error state here - it's not critical if this fails
		}
	};

	const fetchWordCount = async (silent = false) => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		try {
			if (!silent) {
				setLoading(true);
			}
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

			// Get access token - automatically handles refresh
			let token;
			try {
				token = await getAccessTokenSilently();
			} catch (tokenError) {
				console.error("Error getting access token:", tokenError);
				// Check if it's a login_required error
				if (tokenError?.error === "login_required" || tokenError?.message?.includes("login")) {
					throw new Error("Your session has expired. Please log out and log back in.");
				}
				throw new Error("Failed to authenticate. Please try logging out and logging back in.");
			}

			if (!token) {
				throw new Error("Access token is missing. Please try logging in again.");
			}

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
				const errorText = await response.text();
				let errorMessage;
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.error || `Failed to fetch word count: ${response.status}`;
				} catch {
					errorMessage = `Failed to fetch word count: ${response.status}`;
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();

			// Calculate total words written this month
			// Sum all word_count values from the updates
			const total = data.word_count_updates?.reduce((sum, update) => sum + Number(update.word_count), 0) || 0;
			// Ensure it's a proper integer without leading zeros
			setTotalWords(parseInt(total, 10));
		} catch (err) {
			console.error("Error fetching word count:", err);
			setError(err.message);
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		fetchWordCount();
		fetchTodayWordCount();
	}, [isAuthenticated, getAccessTokenSilently]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
			}
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		const wordCount = parseInt(wordCountInput, 10);
		
		if (isNaN(wordCount) || wordCount <= 0) {
			setSubmitError("Please enter a valid number greater than 0");
			return;
		}

		// Clear any existing timeout
		if (loadingTimeoutRef.current) {
			clearTimeout(loadingTimeoutRef.current);
			loadingTimeoutRef.current = null;
		}

		// Store previous values for rollback on error
		const previousTodayWordCount = todayWordCount || 0;
		const previousTotalWords = totalWords || 0;
		const hadPreviousEntry = previousTodayWordCount > 0;

		try {
			setSubmitting(true);
			setShowLoadingText(false);
			setSubmitError(null);
			setSubmitSuccess(null);

			// Optimistic update: immediately update UI with expected values
			setTodayWordCount(wordCount);
			
			// Optimistically update total words for the month
			if (hadPreviousEntry) {
				// Update: subtract old today's count, add new count
				const difference = wordCount - previousTodayWordCount;
				setTotalWords(previousTotalWords + difference);
			} else {
				// New entry: add the new count
				setTotalWords(previousTotalWords + wordCount);
			}
			
			// Show success message optimistically
			setSubmitSuccess(hadPreviousEntry ? "updated" : "submitted");

			// Delay showing loading text by 1000ms (so it doesn't flash for quick requests)
			loadingTimeoutRef.current = setTimeout(() => {
				setShowLoadingText(true);
			}, 1000);

			const token = await getAccessTokenSilently();

			// If there are existing entries for today, delete them first (update behavior)
			if (hadPreviousEntry) {
				const deleteResponse = await fetch("/api/word-count/today", {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!deleteResponse.ok) {
					const errorData = await deleteResponse.json();
					throw new Error(errorData.error || `Failed to delete today's entries: ${deleteResponse.status}`);
				}
			}

			// Create new entry
			const response = await fetch("/api/word-count", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ word_count: wordCount }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to submit word count: ${response.status}`);
			}

			// Confirm with server and refresh to ensure consistency
			// Use silent mode to prevent flashing loading message
			await Promise.all([fetchWordCount(true), fetchTodayWordCount()]);

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSubmitSuccess(null);
			}, 3000);
		} catch (err) {
			console.error("Error submitting word count:", err);
			
			// Rollback optimistic updates on error
			setTodayWordCount(previousTodayWordCount);
			setTotalWords(previousTotalWords);
			
			setSubmitError(err.message);
			setSubmitSuccess(null);
		} finally {
			// Clear the timeout if it hasn't fired yet
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
				loadingTimeoutRef.current = null;
			}
			setSubmitting(false);
			setShowLoadingText(false);
		}
	};

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
					<>
						<section className="word-count-section">
							<form onSubmit={handleSubmit} className="word-count-form">
								<div className="word-count-form-group">
									<label htmlFor="word-count-input" className="word-count-label">
										{todayWordCount > 0 
											? "How many words did you write today?" 
											: "How many words did you write today?"}
									</label>
									<div className="word-count-input-group">
										<input
											id="word-count-input"
											type="number"
											min="1"
											value={wordCountInput}
											onChange={(e) => {
												const value = e.target.value;
												// Strip leading zeros: parse as integer and convert back to string
												// This prevents "075" from appearing when prefilled or pasted
												if (value === "") {
													setWordCountInput("");
												} else {
													const numValue = parseInt(value, 10);
													// Only normalize if it's a valid number and not NaN
													if (!isNaN(numValue) && numValue >= 0) {
														setWordCountInput(String(numValue));
													} else {
														// Allow intermediate typing states (like empty or partial input)
														setWordCountInput(value);
													}
												}
											}}
											placeholder="Enter word count"
											className="word-count-input"
											disabled={submitting}
										/>
										<button
											type="submit"
											disabled={submitting || !wordCountInput}
											className="word-count-submit-btn"
										>
											{showLoadingText ? (todayWordCount > 0 ? "Updating..." : "Submitting...") : (todayWordCount > 0 ? "Update" : "Submit")}
										</button>
									</div>
									{submitError && (
										<p className="word-count-error">{submitError}</p>
									)}
									{submitSuccess && (
										<p className="word-count-success">
											{submitSuccess === "updated" ? "Word count updated successfully!" : "Word count submitted successfully!"}
										</p>
									)}
								</div>
							</form>
						</section>
						
						<section className="word-count-summary-section">
							<p className="word-count-message">
								This month you wrote{" "}
								<span 
									key={`word-count-${totalWords}`}
									className="word-count-number"
								>
									{Number(totalWords || 0).toLocaleString()}
								</span>{" "}
								words.
							</p>
						</section>
					</>
				)}
			</div>
		</div>
	);
}

