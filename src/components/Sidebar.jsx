import { Link } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "../LoginButton";
import LogoutButton from "../LogoutButton";
import Profile from "../Profile";

function Sidebar({ genres, activeGenre, counts, isCollapsed, onToggle }) {
	const { isAuthenticated, isLoading } = useAuth0();

	return (
		<aside className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}>
			<button
				onClick={onToggle}
				className="sidebar-toggle"
				aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
			>
				{isCollapsed ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
				)}
			</button>
			{!isCollapsed && (
				<>
					<div className="sidebar-title">Library</div>

					<nav className="sidebar-nav">
						<Link
							to="/app"
							className={
								activeGenre === null ? "sidebar-link-active" : "sidebar-link"
							}
						>
							All Books
						</Link>

						<div className="sidebar-section">
							<div className="sidebar-heading">Genres</div>
							{genres.map((genre) => (
								<Link
									key={genre.name}
									to={`/app/genre/${encodeURIComponent(genre.name)}`}
									className={
										activeGenre === genre.name
											? "sidebar-link-active"
											: "sidebar-link"
									}
								>
									{genre.name}
									{counts && (
										<span className="ml-2 text-xs text-gray-900">
											({genre.count})
										</span>
									)}
								</Link>
							))}
						</div>
					</nav>

					<div className="mt-auto pt-6 px-6 border-t border-gray-200">
						{!isLoading && (
							<div className="auth-section">
								{isAuthenticated ? (
									<div className="flex flex-col items-center gap-4">
										<Profile />
										<LogoutButton />
									</div>
								) : (
									<div className="flex flex-col items-center gap-2">
										<p className="text-xs text-gray-600 mb-2 text-center">Sign in to access your library</p>
										<LoginButton />
									</div>
								)}
							</div>
						)}
					</div>

					<div className="mt-4 pt-6 px-6 border-t border-gray-200">
						<div className="text-xs text-gray-900">
							Powered by
							<br />
							<a
								href="https://cloudflare.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-800 hover:underline"
							>
								Cloudflare
							</a>
						</div>
					</div>
				</>
			)}
		</aside>
	);
}

export default Sidebar;
