<script>
	let { concert, past = false, ondelete } = $props();

	let confirmDelete = $state(false);

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function daysUntil(dateStr) {
		return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
	}
</script>

<article class="card" class:past>
	<div class="card-accent"></div>
	<div class="card-body">
		<div class="card-top">
			<span class="genre">{concert.genre}</span>
			<div class="card-actions">
				{#if past}
					<a href="/rate" class="rating">{'★'.repeat(concert.rating ?? 0)}{'☆'.repeat(5 - (concert.rating ?? 0))}</a>
				{:else if !past}
					<span class="days-badge">{daysUntil(concert.date)}d away</span>
				{/if}

				{#if confirmDelete}
					<button class="del-confirm" onclick={() => ondelete?.()}>Delete?</button>
					<button class="del-cancel" onclick={() => (confirmDelete = false)}>✕</button>
				{:else}
					<button class="del-btn" onclick={() => (confirmDelete = true)} aria-label="Delete concert">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6l-1 14H6L5 6" />
							<path d="M10 11v6M14 11v6" />
							<path d="M9 6V4h6v2" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<h2 class="artist">{concert.artist}</h2>

		<div class="meta">
			<span class="venue">{concert.venue}</span>
			<span class="separator">·</span>
			<span class="city">{concert.city}</span>
		</div>

		<div class="date">{formatDate(concert.date)}</div>

		{#if past && concert.notes}
			<p class="notes">{concert.notes}</p>
		{/if}
	</div>
</article>

<style>
	.card {
		background: #ffffff;
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 12px;
		display: flex;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.card-accent {
		width: 4px;
		flex-shrink: 0;
		background: #2563eb;
	}

	.card.past .card-accent { background: #6b7280; }

	.card-body {
		padding: 14px 14px 14px 16px;
		flex: 1;
		min-width: 0;
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.genre {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #9ca3af;
	}

	.card-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.rating {
		font-size: 13px;
		color: #f59e0b;
		letter-spacing: 1px;
		text-decoration: none;
	}
	.rating:hover { opacity: 0.75; }

	.days-badge {
		font-size: 11px;
		font-weight: 700;
		color: #2563eb;
		background: #dbeafe;
		padding: 3px 8px;
		border-radius: 20px;
	}

	.del-btn {
		background: none;
		border: none;
		padding: 2px;
		cursor: pointer;
		color: #d1d5db;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}
	.del-btn:hover { color: #ef4444; }
	.del-btn svg { width: 15px; height: 15px; }

	.del-confirm {
		font-size: 11px;
		font-weight: 700;
		color: #ef4444;
		background: #fef2f2;
		border: none;
		border-radius: 6px;
		padding: 3px 8px;
		cursor: pointer;
	}

	.del-cancel {
		font-size: 11px;
		color: #6b7280;
		background: #f3f4f6;
		border: none;
		border-radius: 6px;
		padding: 3px 6px;
		cursor: pointer;
	}

	.artist {
		font-size: 19px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.venue {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.separator { color: #d1d5db; flex-shrink: 0; }

	.city { font-weight: 600; color: #374151; flex-shrink: 0; }

	.date { font-size: 12px; color: #9ca3af; }

	.notes {
		margin: 8px 0 0;
		font-size: 12px;
		color: #6b7280;
		font-style: italic;
		border-top: 1px solid #f3f4f6;
		padding-top: 8px;
		line-height: 1.4;
	}
</style>
