import LogoutButton from "../LogoutButton";

export default function LoggedInPage() {
	return (
		<div className="logged-in-page">
			<header className="logged-in-header">
				<h1 className="logged-in-title">Wrimo</h1>
				<LogoutButton className="login-style" />
			</header>
			<div className="logged-in-container">
			</div>
		</div>
	);
}

