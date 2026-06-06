<script>
	const sites = [
		{
			name: 'Songkick',
			url: 'https://www.songkick.com',
			description: 'Track your favourite artists and get notified when they play near you.',
			category: 'Discovery',
			color: '#f0483e'
		},
		{
			name: 'Bandsintown',
			url: 'https://www.bandsintown.com',
			description: 'Discover live music and concerts from artists you follow on Spotify.',
			category: 'Discovery',
			color: '#00b4b3'
		},
		{
			name: 'Setlist.fm',
			url: 'https://www.setlist.fm',
			description: 'Find and share setlists. See what songs your favourite artists played live.',
			category: 'Setlists',
			color: '#f5a623'
		},
		{
			name: 'Ticketmaster',
			url: 'https://www.ticketmaster.com',
			description: 'Buy and sell tickets for concerts, festivals, and live events worldwide.',
			category: 'Tickets',
			color: '#026cdf'
		},
		{
			name: 'Eventim',
			url: 'https://www.eventim.de',
			description: 'Europe\'s largest ticket platform – popular for concerts in Germany and beyond.',
			category: 'Tickets',
			color: '#e2001a'
		},
		{
			name: 'Dice',
			url: 'https://dice.fm',
			description: 'Modern ticket platform with no hidden fees. Great for club nights & smaller venues.',
			category: 'Tickets',
			color: '#6e00ff'
		},
		{
			name: 'Resident Advisor',
			url: 'https://ra.co',
			description: 'The go-to guide for electronic music events, clubs, and festivals worldwide.',
			category: 'Electronic',
			color: '#1a1a1a'
		},
		{
			name: 'Last.fm',
			url: 'https://www.last.fm',
			description: 'Scrobble your listening history and discover upcoming shows for artists you love.',
			category: 'Discovery',
			color: '#d51007'
		},
		{
			name: 'Jambase',
			url: 'https://www.jambase.com',
			description: 'Concert listings, setlists, and news – great for jam bands and festival culture.',
			category: 'Discovery',
			color: '#2a9d8f'
		}
	];

	const categories = ['All', 'Discovery', 'Tickets', 'Setlists', 'Electronic'];

	let activeCategory = $state('All');

	let filtered = $derived(
		activeCategory === 'All' ? sites : sites.filter((s) => s.category === activeCategory)
	);

	const categoryColor = {
		Discovery: '#2563eb',
		Tickets: '#16a34a',
		Setlists: '#f59e0b',
		Electronic: '#7c3aed'
	};
</script>

<div class="container-xl py-4">
	<div class="mb-4">
		<h1 class="h3 fw-bold mb-1">Explore</h1>
		<p class="text-muted small mb-0">Discover concerts, buy tickets, and find setlists</p>
	</div>

	<!-- Category filter -->
	<div class="genre-bar mb-4">
		{#each categories as cat}
			<button
				class="chip"
				class:active={activeCategory === cat}
				onclick={() => (activeCategory = cat)}
			>{cat}</button>
		{/each}
	</div>

	<!-- Site cards -->
	<div class="row g-3">
		{#each filtered as site}
			{@const catColor = categoryColor[site.category] ?? '#9ca3af'}
			<div class="col-12 col-md-6 col-lg-4">
				<a href={site.url} target="_blank" rel="noopener noreferrer" class="site-card h-100">
					<div class="card-accent" style="background:{site.color}"></div>
					<div class="card-inner">
						<div class="d-flex justify-content-between align-items-center mb-2">
							<span class="category-tag" style="color:{catColor};background:{catColor}1a">{site.category}</span>
							<span class="ext-icon">↗</span>
						</div>
						<h2 class="site-name">{site.name}</h2>
						<p class="site-desc">{site.description}</p>
						<span class="site-url">{site.url.replace('https://', '')}</span>
					</div>
				</a>
			</div>
		{/each}
	</div>
</div>

<style>
	.genre-bar {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		padding-bottom: 4px;
	}
	.genre-bar::-webkit-scrollbar {
		display: none;
	}

	.chip {
		padding: 5px 16px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 600;
		border: 1.5px solid #dee2e6;
		background: #fff;
		color: #6b7280;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.chip.active {
		background: #111827;
		border-color: #111827;
		color: #fff;
	}

	.site-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
		display: flex;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.15s, transform 0.15s;
	}
	.site-card:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
		color: inherit;
	}

	.card-accent {
		width: 5px;
		flex-shrink: 0;
	}

	.card-inner {
		padding: 14px 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.category-tag {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 3px 8px;
		border-radius: 20px;
	}

	.ext-icon {
		font-size: 16px;
		color: #9ca3af;
		font-weight: 600;
	}

	.site-name {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 6px;
	}

	.site-desc {
		font-size: 13px;
		color: #6b7280;
		margin: 0 0 auto;
		line-height: 1.5;
		padding-bottom: 10px;
	}

	.site-url {
		font-size: 12px;
		color: #9ca3af;
		margin-top: auto;
	}
</style>
