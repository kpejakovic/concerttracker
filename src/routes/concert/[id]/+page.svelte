<script>
	import { page } from '$app/state';
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { discoverData } from '$lib/data/discover.js';
	import { concertsData } from '$lib/data/concerts.js';

	const id = Number(page.params.id);

	const allStaticConcerts = [...concertsData, ...discoverData];
	const staticConcert = allStaticConcerts.find((c) => c.id === id);

	let storeItem = $derived(concertStore.items.find((c) => c.id === id));
	let concert = $derived(storeItem ?? staticConcert);
	let isSaved = $derived(concertStore.items.some((c) => c.id === id));

	function toggleSave() {
		if (!concert) return;
		if (isSaved) {
			concertStore.remove(concert.id);
		} else {
			concertStore.add(concert);
		}
	}

	const genreColor = {
		'Pop': '#ec4899', 'Rock': '#2563eb', 'Metal': '#ef4444',
		'Alt-Rock': '#7c3aed', 'Alt-Pop': '#0891b2', 'R&B': '#f59e0b',
		'Hip-Hop': '#16a34a', 'Electronic': '#06b6d4', 'Jazz': '#6366f1',
		'Classical': '#64748b', 'Country': '#ca8a04', 'Other': '#9ca3af',
	};

	function formatDate(d) {
		return new Date(d).toLocaleDateString('en-GB', {
			weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
		});
	}

	let isPast = $derived(concert ? new Date(concert.date) < new Date() : false);
</script>

<div class="container-xl py-4">
	<a href="/" class="btn btn-outline-secondary btn-sm mb-4">← Back to Explore</a>

	{#if concert}
		{@const color = genreColor[concert.genre] ?? '#9ca3af'}
		<div class="row g-4">
			<!-- Main detail card -->
			<div class="col-12 col-lg-8">
				<div class="card border-0 shadow-sm overflow-hidden">
					<div class="card-header-hero" style="border-left: 6px solid {color}; padding: 24px 28px 20px; background: #fff;">
						<div class="d-flex align-items-center gap-2 mb-3">
							<span
								class="badge rounded-pill fw-semibold"
								style="color:{color}; background:{color}1a; font-size:12px; padding:5px 12px;"
							>{concert.genre}</span>
							{#if isPast}
								<span class="badge bg-secondary">Past</span>
							{:else}
								<span class="badge bg-success">Upcoming</span>
							{/if}
						</div>
						<h1 class="display-5 fw-bold mb-0" style="letter-spacing:-1px;">{concert.artist}</h1>
					</div>

					<div class="card-body px-4 pt-3 pb-4">
						<div class="row g-3 border-top pt-3 mb-3">
							<div class="col-6 col-sm-3">
								<div class="text-uppercase text-muted small fw-bold mb-1" style="font-size:11px;letter-spacing:.06em;">Venue</div>
								<div class="fw-semibold">{concert.venue}</div>
							</div>
							<div class="col-6 col-sm-3">
								<div class="text-uppercase text-muted small fw-bold mb-1" style="font-size:11px;letter-spacing:.06em;">City</div>
								<div class="fw-semibold">{concert.city}</div>
							</div>
							<div class="col-6 col-sm-3">
								<div class="text-uppercase text-muted small fw-bold mb-1" style="font-size:11px;letter-spacing:.06em;">Date</div>
								<div class="fw-semibold">{formatDate(concert.date)}</div>
							</div>
							<div class="col-6 col-sm-3">
								<div class="text-uppercase text-muted small fw-bold mb-1" style="font-size:11px;letter-spacing:.06em;">Genre</div>
								<div class="fw-semibold">{concert.genre}</div>
							</div>
						</div>

						{#if concert.notes}
							<div class="p-3 rounded-3 mb-3" style="background:#f9fafb;">
								<div class="text-uppercase text-muted small fw-bold mb-1" style="font-size:11px;letter-spacing:.06em;">Notes</div>
								<p class="mb-0 fst-italic text-secondary">"{concert.notes}"</p>
							</div>
						{/if}

						{#if concert.rating}
							<div>
								<div class="text-uppercase text-muted small fw-bold mb-2" style="font-size:11px;letter-spacing:.06em;">Your Rating</div>
								<div class="d-flex align-items-center gap-1">
									{#each [1, 2, 3, 4, 5] as n}
										<span style="font-size:24px; color:{n <= concert.rating ? '#f59e0b' : '#e5e7eb'};">★</span>
									{/each}
									<span class="text-muted ms-2 fw-semibold">{concert.rating}/5</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Action card -->
			<div class="col-12 col-lg-4">
				<div class="card border-0 shadow-sm">
					<div class="card-body p-4">
						<h5 class="fw-bold mb-3">Your list</h5>
						<button
							class="btn w-100 mb-3 fw-semibold"
							class:btn-success={isSaved}
							class:btn-outline-primary={!isSaved}
							onclick={toggleSave}
						>
							{isSaved ? '✓ Saved to My Concerts' : '+ Save to My Concerts'}
						</button>
						<a href="/map" class="btn btn-outline-secondary w-100">View on Map</a>

						{#if isSaved}
							<hr />
							<a href="/rate" class="btn btn-outline-warning w-100 fw-semibold">Rate this concert</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-5 text-muted">
			<div class="fs-1 mb-2">🔍</div>
			<p>Concert not found.</p>
			<a href="/" class="btn btn-primary mt-2">Back to Explore</a>
		</div>
	{/if}
</div>
