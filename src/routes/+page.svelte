<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { discoverData } from '$lib/data/discover.js';
	import AddConcertModal from '$lib/components/AddConcertModal.svelte';

	let showModal = $state(false);
	let search = $state('');
	let activeGenre = $state('All');

	const genres = ['All', 'Pop', 'Rock', 'Metal', 'Alt-Rock', 'Alt-Pop', 'R&B', 'Hip-Hop', 'Electronic', 'Jazz'];

	const genreColor = {
		'Pop': '#ec4899', 'Rock': '#2563eb', 'Metal': '#ef4444',
		'Alt-Rock': '#7c3aed', 'Alt-Pop': '#0891b2', 'R&B': '#f59e0b',
		'Hip-Hop': '#16a34a', 'Electronic': '#06b6d4', 'Jazz': '#6366f1',
		'Classical': '#64748b', 'Country': '#ca8a04', 'Other': '#9ca3af',
	};

	function isSaved(id) {
		return concertStore.items.some((c) => c.id === id);
	}

	function toggleSave(concert) {
		if (isSaved(concert.id)) {
			concertStore.remove(concert.id);
		} else {
			concertStore.add(concert);
		}
	}

	let filtered = $derived(
		discoverData
			.filter((c) => activeGenre === 'All' || c.genre === activeGenre)
			.filter((c) => {
				if (!search.trim()) return true;
				const q = search.toLowerCase();
				return (
					c.artist.toLowerCase().includes(q) ||
					c.city.toLowerCase().includes(q) ||
					c.venue.toLowerCase().includes(q)
				);
			})
			.sort((a, b) => new Date(a.date) - new Date(b.date))
	);

	function formatDate(d) {
		return new Date(d).toLocaleDateString('en-GB', {
			weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
		});
	}
</script>

<div class="container-xl py-4">
	<!-- Page header -->
	<div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
		<div>
			<h1 class="h3 fw-bold mb-0">Explore Concerts</h1>
			<p class="text-muted small mb-0">{filtered.length} upcoming concerts</p>
		</div>
		<button class="btn btn-primary" onclick={() => (showModal = true)}>+ Add Concert</button>
	</div>

	<!-- Search -->
	<div class="mb-3">
		<input
			class="form-control"
			type="search"
			placeholder="Search by artist, venue or city…"
			bind:value={search}
		/>
	</div>

	<!-- Genre filter chips -->
	<div class="genre-bar mb-4">
		{#each genres as g}
			<button
				class="chip"
				class:active={activeGenre === g}
				onclick={() => (activeGenre = g)}
			>{g}</button>
		{/each}
	</div>

	<!-- Concert grid -->
	{#if filtered.length === 0}
		<div class="text-center py-5 text-muted">
			<div class="fs-1 mb-2">🔍</div>
			<p>No concerts match your search.</p>
		</div>
	{:else}
		<div class="row g-3">
			{#each filtered as concert (concert.id)}
				{@const saved = isSaved(concert.id)}
				{@const color = genreColor[concert.genre] ?? '#9ca3af'}
				<div class="col-12 col-md-6 col-lg-4">
					<div class="concert-card h-100">
						<div class="card-accent" style="background:{color}"></div>
						<div class="card-body-inner">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="genre-tag" style="color:{color};background:{color}1a">{concert.genre}</span>
								<button
									class="save-btn"
									class:saved
									onclick={() => toggleSave(concert)}
								>{saved ? 'Going ✓' : 'Save'}</button>
							</div>
							<h2 class="concert-artist">{concert.artist}</h2>
							<div class="concert-meta">{concert.venue} · {concert.city}</div>
							<div class="concert-date">{formatDate(concert.date)}</div>
							<a href="/concert/{concert.id}" class="detail-link mt-auto pt-2">View details →</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<AddConcertModal
	open={showModal}
	onclose={() => (showModal = false)}
	onadd={(concert) => concertStore.add(concert)}
/>

<style>
	.genre-bar {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		padding-bottom: 4px;
	}
	.genre-bar::-webkit-scrollbar { display: none; }

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

	.concert-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
		display: flex;
		overflow: hidden;
		transition: box-shadow 0.15s, transform 0.15s;
	}
	.concert-card:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}

	.card-accent {
		width: 5px;
		flex-shrink: 0;
	}

	.card-body-inner {
		padding: 14px 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.genre-tag {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 3px 8px;
		border-radius: 20px;
	}

	.save-btn {
		font-size: 12px;
		font-weight: 700;
		padding: 4px 12px;
		border-radius: 20px;
		border: 1.5px solid #2563eb;
		background: transparent;
		color: #2563eb;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}
	.save-btn.saved {
		background: #16a34a;
		border-color: #16a34a;
		color: #fff;
	}

	.concert-artist {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 4px;
	}

	.concert-meta {
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 2px;
	}

	.concert-date {
		font-size: 12px;
		color: #9ca3af;
	}

	.detail-link {
		font-size: 13px;
		font-weight: 600;
		color: #2563eb;
		text-decoration: none;
		display: inline-block;
	}
	.detail-link:hover { text-decoration: underline; }
</style>
