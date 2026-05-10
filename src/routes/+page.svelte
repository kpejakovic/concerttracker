<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { discoverData } from '$lib/data/discover.js';
	import AddConcertModal from '$lib/components/AddConcertModal.svelte';

	let showModal = $state(false);
	let showSearch = $state(false);
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

	function toggleSearch() {
		showSearch = !showSearch;
		if (!showSearch) search = '';
	}
</script>

<header class="header">
	<div class="header-row">
		<div class="header-left">
			<h1 class="title">Explore Concerts</h1>
			<p class="subtitle">{filtered.length} upcoming concerts</p>
		</div>
		<div class="header-actions">
			<button class="icon-btn" class:active={showSearch} onclick={toggleSearch} aria-label="Search">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
					stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
				</svg>
			</button>
			<button class="add-btn" onclick={() => (showModal = true)} aria-label="Add concert">+</button>
		</div>
	</div>

	{#if showSearch}
		<div class="search-wrap">
			<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
			</svg>
			<input
				class="search-input"
				type="search"
				placeholder="Artist, venue or city…"
				bind:value={search}
				autofocus
			/>
		</div>
	{/if}
</header>

<div class="genre-bar">
	{#each genres as g}
		<button class="chip" class:active={activeGenre === g} onclick={() => (activeGenre = g)}>{g}</button>
	{/each}
</div>

<main class="list">
	{#if filtered.length === 0}
		<div class="empty">
			<span class="empty-icon">🔍</span>
			<p>No concerts match your search.</p>
		</div>
	{:else}
		{#each filtered as concert (concert.id)}
			{@const saved = isSaved(concert.id)}
			{@const color = genreColor[concert.genre] ?? '#9ca3af'}
			<article class="card">
				<div class="card-accent" style="background:{color}"></div>
				<div class="card-body">
					<div class="card-top">
						<span class="genre-tag" style="color:{color};background:{color}1a">{concert.genre}</span>
						<button
							class="save-btn"
							class:saved
							onclick={() => toggleSave(concert)}
							aria-label={saved ? 'Remove from list' : 'Save to list'}
						>
							{#if saved}
								Going ✓
							{:else}
								Save
							{/if}
						</button>
					</div>
					<h2 class="artist">{concert.artist}</h2>
					<div class="meta">{concert.venue} · {concert.city}</div>
					<div class="date">{formatDate(concert.date)}</div>
				</div>
			</article>
		{/each}
	{/if}
</main>

<AddConcertModal
	open={showModal}
	onclose={() => (showModal = false)}
	onadd={(concert) => concertStore.add(concert)}
/>

<style>
	.header {
		padding: 12px 16px 10px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2px;
	}

	.title {
		font-size: 24px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
		line-height: 1;
	}

	.subtitle {
		font-size: 12px;
		color: #9ca3af;
		margin-top: 2px;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f3f4f6;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #374151;
		transition: background 0.15s;
	}
	.icon-btn svg { width: 17px; height: 17px; }
	.icon-btn.active { background: #dbeafe; color: #2563eb; }

	.add-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #2563eb;
		color: #fff;
		font-size: 24px;
		font-weight: 300;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.15s, transform 0.15s;
	}
	.add-btn:active { transform: scale(0.92); opacity: 0.85; }

	.search-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
		background: #f3f4f6;
		border-radius: 12px;
		padding: 0 12px;
	}

	.search-icon { width: 15px; height: 15px; color: #9ca3af; flex-shrink: 0; }

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		padding: 10px 0;
		font-size: 14px;
		color: #111827;
		outline: none;
		font-family: inherit;
	}
	.search-input::placeholder { color: #9ca3af; }
	.search-input::-webkit-search-cancel-button { display: none; }

	/* Genre chips */
	.genre-bar {
		display: flex;
		gap: 6px;
		padding: 10px 14px;
		overflow-x: auto;
		flex-shrink: 0;
		background: #fff;
		border-bottom: 1px solid #f3f4f6;
		scrollbar-width: none;
	}
	.genre-bar::-webkit-scrollbar { display: none; }

	.chip {
		padding: 5px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		border: 1.5px solid #e5e7eb;
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

	/* List */
	.list {
		flex: 1;
		padding: 12px 14px 20px;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 60px 20px;
		color: #9ca3af;
		font-size: 14px;
		text-align: center;
	}
	.empty-icon { font-size: 32px; }

	/* Card */
	.card {
		background: #fff;
		border-radius: 16px;
		margin-bottom: 10px;
		display: flex;
		overflow: hidden;
		box-shadow: 0 1px 4px rgba(0,0,0,0.07);
	}

	.card-accent {
		width: 4px;
		flex-shrink: 0;
	}

	.card-body {
		padding: 12px 14px;
		flex: 1;
		min-width: 0;
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.genre-tag {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 3px 8px;
		border-radius: 20px;
	}

	.save-btn {
		font-size: 11px;
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
	.save-btn:active { opacity: 0.8; }

	.artist {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 3px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.date {
		font-size: 11px;
		color: #9ca3af;
	}
</style>
