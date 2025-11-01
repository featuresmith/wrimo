import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
	const { user, isAuthenticated, isLoading } = useAuth0();

	if (isLoading) {
		return <div className="loading-text">Loading profile...</div>;
	}

	return (
		isAuthenticated && user ? (
			<div className="flex flex-col items-center gap-4 w-full">
				{user.picture && (
					<img 
						src={user.picture} 
						alt={user.name || 'User'} 
						className="profile-picture w-20 h-20"
					/>
				)}
				<div className="text-center w-full">
					<div className="profile-name">
						{user.name}
					</div>
					<div className="profile-email">
						{user.email}
					</div>
				</div>
			</div>
		) : null
	);
};

export default Profile;

