<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';

	const today = new Date();

	let pastConcerts = $derived(
		concertStore.items
			.filter((c) => new Date(c.date) < today)
			.sort((a, b) => {
				if (!a.rating && b.rating) return -1;
				if (a.rating && !b.rating) return 1;
				return new Date(b.date) - new Date(a.date);
			})
	);

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

<div class="container-xl py-4">
	<div class="d-flex align-items-center gap-3 mb-4">
		<a href="/profile" class="btn btn-outline-secondary btn-sm">← Back</a>
		<div class="d-flex align-items-center gap-2">
			<h1 class="h3 fw-bold mb-0">Rate Concerts</h1>
			{#if unrated > 0}
				<span class="badge bg-warning text-dark">{unrated} unrated</span>
			{/if}
		</div>
	</div>

	{#if pastConcerts.length === 0}
		<div class="text-center py-5 text-muted">
			<div class="fs-1 mb-2">🎵</div>
			<p>No past concerts yet.<br />Add some on the Explore page!</p>
		</div>
	{:else}
		<div class="row g-3">
			{#each pastConcerts as concert (concert.id)}
				<div class="col-12 col-md-6 col-lg-4">
					<div class="card border-0 shadow-sm h-100" style="border-left:4px solid {concert.rating ? '#f59e0b' : '#e5e7eb'} !important;">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="text-uppercase text-muted fw-bold" style="font-size:11px;letter-spacing:.07em;">{concert.genre}</span>
								{#if concert.rating}
									<span class="badge bg-warning text-dark">Rated</span>
								{:else}
									<span class="badge bg-light text-muted border">Not rated</span>
								{/if}
							</div>

							<h5 class="fw-bold mb-1 text-truncate">{concert.artist}</h5>
							<div class="text-muted small mb-1">{concert.venue} · {concert.city}</div>
							<div class="text-muted mb-3" style="font-size:12px;">{formatDate(concert.date)}</div>

							<!-- Stars -->
							<div class="d-flex gap-1 mb-3">
								{#each [1, 2, 3, 4, 5] as n}
									<button
										class="btn p-0 border-0 bg-transparent star-btn"
										onclick={() => setRating(concert, n)}
										aria-label="{n} star{n > 1 ? 's' : ''}"
										style="font-size:28px;line-height:1;color:{n <= (concert.rating ?? 0) ? '#f59e0b' : '#e5e7eb'};transition:color .1s;"
									>★</button>
								{/each}
							</div>

							<!-- Notes -->
							{#if editingNotes === concert.id}
								<textarea
									class="form-control form-control-sm mb-2"
									bind:value={tmpNotes}
									placeholder="How was it?"
									rows="2"
								></textarea>
								<div class="d-flex gap-2">
									<button class="btn btn-sm btn-primary" onclick={() => saveNotes(concert)}>Save</button>
									<button class="btn btn-sm btn-secondary" onclick={() => (editingNotes = null)}>Cancel</button>
								</div>
							{:else}
								<button
									class="w-100 text-start border rounded-3 p-2 bg-transparent"
									style="border-style:dashed !important;border-color:#dee2e6;cursor:pointer;transition:border-color .15s;"
									onclick={() => startNotes(concert)}
								>
									{#if concert.notes}
										<span class="text-muted fst-italic" style="font-size:12px;">"{concert.notes}"</span>
									{:else}
										<span class="text-muted" style="font-size:12px;">+ Add a note…</span>
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.star-btn:hover { color: #f59e0b !important; }
	.star-btn:active { transform: scale(0.88); }
</style>
