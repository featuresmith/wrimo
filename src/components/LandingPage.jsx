export default function LandingPage() {
	return (
		<div className="landing-page">
			<div className="landing-container">
				<header className="landing-header">
					<h1 className="landing-title">Wrimo</h1>
					<p className="landing-subtitle">
						The global writing challenge where the reward is your own book.
					</p>
					<p className="coming-soon">Coming Soon</p>
				</header>

				<section className="features-section">
					<div className="feature-card">
						<div className="feature-emoji">✍️</div>
						<h2 className="feature-title">Write Daily</h2>
						<p className="feature-description">
							Build a consistent writing habit with daily goals and tracking.
						</p>
					</div>

					<div className="feature-card">
						<div className="feature-emoji">🌍</div>
						<h2 className="feature-title">Global Community</h2>
						<p className="feature-description">
							Connect with writers from around the world on the same journey.
						</p>
					</div>

					<div className="feature-card">
						<div className="feature-emoji">📚</div>
						<h2 className="feature-title">Your Book</h2>
						<p className="feature-description">
							The ultimate reward is holding your finished manuscript.
						</p>
					</div>

					<div className="feature-card">
						<div className="feature-emoji">🧠</div>
						<h2 className="feature-title">Guided Prompts</h2>
						<p className="feature-description">
							Start every session with focused prompts and scene ideas to beat writer's block.
						</p>
					</div>
				</section>

				<footer className="landing-footer">
					<p>© MMXXV</p>
				</footer>
			</div>
		</div>
	);
}

