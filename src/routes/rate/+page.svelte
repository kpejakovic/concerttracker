<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';

	const today = new Date();

	let pastConcerts = $derived(
		concertStore.items
			.filter((c) => new Date(c.date) < today)
			.sort((a, b) => {
				// Unrated first, then by most recent
				if (!a.rating && b.rating) return -1;
				if (a.rating && !b.rating) return 1;
				return new Date(b.date) - new Date(a.date);
			})
	);

	// Track which concert is being edited (notes)
	let editingNotes = $state(null);
	let tmpNotes = $state('');

	function startNotes(concert) {
		editingNotes = concert.id;
		tmpNotes = concert.notes ?? '';
	}

	function saveNotes(concert) {
		concertStore.rate(concert.id, concert.rating ?? 0, tmpNotes);
		editingNotes = null;
	}

	function setRating(concert, n) {
		// Toggle off if tapping the same star
		const newRating = concert.rating === n ? 0 : n;
		concertStore.rate(concert.id, newRating, concert.notes);
	}

	function formatDate(d) {
		return new Date(d).toLocaleDateString('en-GB', {
			weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
		});
	}

	let unrated = $derived(pastConcerts.filter((c) => !c.rating).length);
</script>

<header class="header">
	<a href="/profile" class="back-btn" aria-label="Back to profile">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
			stroke-linecap="round" stroke-linejoin="round">
			<path d="M15 18l-6-6 6-6" />
		</svg>
	</a>
	<div class="header-text">
		<h1 class="title">Rate Concerts</h1>
		{#if unrated > 0}
			<span class="unrated-badge">{unrated} unrated</span>
		{/if}
	</div>
</header>

<div class="list">
	{#if pastConcerts.length === 0}
		<div class="empty">
			<span class="empty-icon">🎵</span>
			<p>No past concerts yet.<br />Add some on the Home tab!</p>
		</div>
	{:else}
		{#each pastConcerts as concert (concert.id)}
			<div class="card" class:rated={!!concert.rating}>
				<div class="card-left">
					<div class="accent" style="background:{concert.rating ? '#f59e0b' : '#e5e7eb'}"></div>
				</div>

				<div class="card-body">
					<div class="card-top">
						<span class="genre">{concert.genre}</span>
						<div class="card-top-right">
							{#if concert.rating}
								<span class="rated-label">Rated</span>
							{:else}
								<span class="unrated-label">Not rated</span>
							{/if}
							<a href="/" class="home-link" aria-label="Go to home">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
									<polyline points="9 22 9 12 15 12 15 22"/>
								</svg>
							</a>
						</div>
					</div>

					<div class="artist">{concert.artist}</div>
					<div class="meta">{concert.venue} · {concert.city}</div>
					<div class="date">{formatDate(concert.date)}</div>

					<!-- Star rating -->
					<div class="stars">
						{#each [1, 2, 3, 4, 5] as n}
							<button
								class="star"
								class:filled={n <= (concert.rating ?? 0)}
								onclick={() => setRating(concert, n)}
								aria-label="{n} star{n > 1 ? 's' : ''}"
							>★</button>
						{/each}
					</div>

					<!-- Notes -->
					{#if editingNotes === concert.id}
						<div class="notes-edit">
							<textarea
								bind:value={tmpNotes}
								placeholder="How was it?"
								rows="2"
							></textarea>
							<div class="notes-actions">
								<button class="pill blue" onclick={() => saveNotes(concert)}>Save</button>
								<button class="pill gray" onclick={() => (editingNotes = null)}>Cancel</button>
							</div>
						</div>
					{:else}
						<button class="notes-row" onclick={() => startNotes(concert)}>
							{#if concert.notes}
								<span class="notes-text">"{concert.notes}"</span>
							{:else}
								<span class="notes-placeholder">+ Add a note…</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px 12px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.back-btn {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #374151;
		text-decoration: none;
	}
	.back-btn svg { width: 18px; height: 18px; }

	.header-text {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.title {
		font-size: 20px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
	}

	.unrated-badge {
		font-size: 11px;
		font-weight: 700;
		background: #fef3c7;
		color: #d97706;
		padding: 3px 8px;
		border-radius: 20px;
	}

	.list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 12px 14px 24px;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 60px 20px;
		color: #9ca3af;
		font-size: 14px;
		text-align: center;
		line-height: 1.6;
	}
	.empty-icon { font-size: 36px; }

	/* Card */
	.card {
		background: #fff;
		border-radius: 16px;
		margin-bottom: 12px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.08);
		display: flex;
		overflow: hidden;
		transition: box-shadow 0.15s;
	}

	.card-left { flex-shrink: 0; }

	.accent {
		width: 4px;
		height: 100%;
		transition: background 0.3s;
	}

	.card-body {
		padding: 13px 14px;
		flex: 1;
		min-width: 0;
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 5px;
	}

	.card-top-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.home-link {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9ca3af;
		text-decoration: none;
		transition: color 0.15s;
	}
	.home-link:hover { color: #2563eb; }
	.home-link svg { width: 14px; height: 14px; }

	.genre {
		font-size: 11px;
		font-weight: 600;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.rated-label {
		font-size: 11px;
		font-weight: 700;
		color: #d97706;
		background: #fef3c7;
		padding: 2px 8px;
		border-radius: 20px;
	}

	.unrated-label {
		font-size: 11px;
		font-weight: 700;
		color: #9ca3af;
		background: #f3f4f6;
		padding: 2px 8px;
		border-radius: 20px;
	}

	.artist {
		font-size: 17px;
		font-weight: 700;
		color: #111827;
		margin-bottom: 3px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 2px;
	}

	.date {
		font-size: 11px;
		color: #9ca3af;
		margin-bottom: 10px;
	}

	/* Stars */
	.stars {
		display: flex;
		gap: 2px;
		margin-bottom: 8px;
	}

	.star {
		background: none;
		border: none;
		font-size: 28px;
		line-height: 1;
		padding: 0 2px;
		cursor: pointer;
		color: #e5e7eb;
		transition: color 0.1s, transform 0.1s;
	}
	.star.filled { color: #f59e0b; }
	.star:active { transform: scale(0.88); }

	/* Notes */
	.notes-row {
		width: 100%;
		background: #f9fafb;
		border: 1.5px dashed #e5e7eb;
		border-radius: 10px;
		padding: 8px 12px;
		text-align: left;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.notes-row:hover { border-color: #d1d5db; }

	.notes-text {
		font-size: 12px;
		color: #6b7280;
		font-style: italic;
		line-height: 1.4;
	}

	.notes-placeholder {
		font-size: 12px;
		color: #d1d5db;
	}

	.notes-edit {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.notes-edit textarea {
		width: 100%;
		padding: 8px 10px;
		border: 1.5px solid #2563eb;
		border-radius: 10px;
		font-size: 13px;
		font-family: inherit;
		outline: none;
		color: #111827;
		background: #f0f4ff;
		resize: none;
		line-height: 1.5;
	}

	.notes-actions { display: flex; gap: 8px; }

	.pill {
		padding: 5px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 700;
		border: none;
		cursor: pointer;
	}
	.pill.blue { background: #2563eb; color: #fff; }
	.pill.gray { background: #f3f4f6; color: #6b7280; }
</style>
