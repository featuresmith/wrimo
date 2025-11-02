import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { groupByGenre } from "./lib/utils";
import Breadcrumbs from "./components/Breadcrumbs";
import Sidebar from "./components/Sidebar";
import BooksList from "./components/BooksList";
import BookDetail from "./components/BookDetail";

function App() {
	const navigate = useNavigate();
	const params = useParams();
	const { getAccessTokenSilently } = useAuth0();
	const [bookDetail, setBookDetail] = useState(null);
	const [loading, setLoading] = useState(false);
	const [genres, setGenres] = useState([]);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	// Get route parameters
	const { bookId, genreId } = params;
	const activeGenre = genreId ? decodeURIComponent(genreId) : null;

	// Load genres for sidebar
	useEffect(() => {
		const loadGenres = async () => {
			try {
				const response = await fetch("/api/books");
				if (!response.ok) {
					throw new Error(`API returned status: ${response.status}`);
				}
				const data = await response.json();

				if (!data.books?.length) {
					console.error("No books data found:", typeof data);
					return;
				}

				const booksArray = data.books;

				const genreGroups = groupByGenre(booksArray);
				setGenres(genreGroups);
			} catch (error) {
				console.error("Error loading genres:", error);
			}
		};

		loadGenres();
	}, []);

	// Load book details when a book is selected via URL
	useEffect(() => {
		if (!bookId) return;

		const fetchBookDetail = async () => {
			setLoading(true);
			setBookDetail(null);
			
			try {
				// First get basic book details
				const bookResponse = await fetch(`/api/books/${bookId}`);

				if (!bookResponse.ok) {
					throw new Error(`Failed to fetch book: ${bookResponse.status}`);
				}

				const bookData = await bookResponse.json();

				// Then get related books data (protected endpoint)
				const token = await getAccessTokenSilently();
				const relatedResponse = await fetch(`/api/books/${bookId}/related`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!relatedResponse.ok) {
					throw new Error(`Failed to fetch related books: ${relatedResponse.status}`);
				}

				const relatedData = await relatedResponse.json();

				// Combine the data
				const combinedData = {
					book: bookData.book,
					relatedBooks: relatedData.relatedBooks,
					recentRecommendations: relatedData.recentRecommendations,
					genreStats: relatedData.genreStats,
				};

				setBookDetail(combinedData);
			} catch (error) {
				console.error("Error fetching book details:", error);
				setBookDetail(null);
			} finally {
				setLoading(false);
			}
		};

		fetchBookDetail();
	}, [bookId, getAccessTokenSilently]);

	const handleSelectBook = (bookId) => {
		navigate(`/app/book/${bookId}`);
	};

	const handleSelectGenre = (genre) => {
		if (genre) {
			navigate(`/app/genre/${encodeURIComponent(genre)}`);
		} else {
			navigate("/app");
		}
	};

	return (
		<div className="layout">
			<Sidebar
				genres={genres}
				activeGenre={activeGenre}
				onSelectGenre={handleSelectGenre}
				counts={true}
				isCollapsed={isSidebarCollapsed}
				onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
			/>

			<main className={`main-content ${isSidebarCollapsed ? "main-content-expanded" : ""}`}>
				{/* Breadcrumbs for main library page */}
				{!bookId && (
					<Breadcrumbs
						items={[
							{ label: "All Books", value: null },
							...(activeGenre
								? [{ label: activeGenre, value: activeGenre }]
								: []),
						]}
						onNavigate={(value) => {
							if (value === null) {
								handleSelectGenre(null);
							}
						}}
					/>
				)}

				<div className="page-header">
					<h1>{activeGenre ? `${activeGenre} Books` : "My Library"}</h1>
					<p className="text-gray-900">
						{activeGenre
							? `Explore our collection of ${activeGenre.toLowerCase()} books`
							: "Discover your next favorite book"}
					</p>

				</div>

				{bookId ? (
					loading ? (
						<div className="flex justify-center items-center py-20">
							<div className="h-10 w-10 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : bookDetail ? (
						<BookDetail bookData={bookDetail} />
					) : (
						<div className="text-center py-20 text-gray-600">
							Log in to view book details.
						</div>
					)
				) : (
					<BooksList onSelectBook={handleSelectBook} filter={activeGenre} />
				)}
			</main>
		</div>
	);
}

export default App;
