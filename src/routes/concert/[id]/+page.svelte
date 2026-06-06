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

	let lightboxIndex = $state(null);
	let lightboxSrc = $derived(
		lightboxIndex !== null ? (concert?.photos?.[lightboxIndex] ?? null) : null
	);

	function openLightbox(index) { lightboxIndex = index; }
	function closeLightbox() { lightboxIndex = null; }

	function prevPhoto() {
		if (lightboxIndex === null || !concert?.photos?.length) return;
		lightboxIndex = (lightboxIndex - 1 + concert.photos.length) % concert.photos.length;
	}

	function nextPhoto() {
		if (lightboxIndex === null || !concert?.photos?.length) return;
		lightboxIndex = (lightboxIndex + 1) % concert.photos.length;
	}

	function handleKeydown(e) {
		if (lightboxIndex === null) return;
		if (e.key === 'ArrowLeft') prevPhoto();
		else if (e.key === 'ArrowRight') nextPhoto();
		else if (e.key === 'Escape') closeLightbox();
	}

	let newSong = $state('');

	function addSong() {
		const song = newSong.trim();
		if (!song) return;
		concertStore.updateSetlist(concert.id, [...(concert.setlist ?? []), song]);
		newSong = '';
	}

	function removeSong(index) {
		const updated = (concert.setlist ?? []).filter((_, i) => i !== index);
		concertStore.updateSetlist(concert.id, updated);
	}

	async function compressImage(file, maxDim = 1200, quality = 0.82) {
		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);
				const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
				const canvas = document.createElement('canvas');
				canvas.width = Math.round(img.width * scale);
				canvas.height = Math.round(img.height * scale);
				canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL('image/jpeg', quality));
			};
			img.src = url;
		});
	}

	async function handlePhotoUpload(event) {
		const files = [...(event.target.files ?? [])];
		if (!files.length) return;
		const existing = concert?.photos ?? [];
		const compressed = await Promise.all(files.map((f) => compressImage(f)));
		concertStore.updatePhotos(concert.id, [...existing, ...compressed]);
		event.target.value = '';
	}
</script>

<div class="container-xl py-4">
	<a href="/" class="btn btn-outline-secondary btn-sm mb-4">← Back to My Concerts</a>

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

						{#if isPast && isSaved}
							<div class="mt-3 pt-3 border-top">
								<div class="d-flex align-items-center justify-content-between mb-2">
									<div class="text-uppercase text-muted small fw-bold" style="font-size:11px;letter-spacing:.06em;">
										Photos {#if concert.photos?.length}<span class="text-muted fw-normal normal-case">({concert.photos.length})</span>{/if}
									</div>
									<label class="btn btn-outline-secondary btn-sm">
										+ Add Photos
										<input type="file" accept="image/*" multiple class="visually-hidden" onchange={handlePhotoUpload} />
									</label>
								</div>
								{#if concert.photos?.length}
									<div class="d-flex flex-wrap gap-2">
										{#each concert.photos as photo, i}
											<button class="detail-photo-thumb" onclick={() => openLightbox(i)} title="Foto anzeigen">
												<img src={photo} alt="Foto {i + 1}" />
											</button>
										{/each}
									</div>
								{:else}
									<p class="text-muted small mb-0" style="font-style:italic;">No photos yet — add your first memory!</p>
								{/if}
							</div>
						{/if}

						{#if isPast && isSaved}
							<div class="mt-3 pt-3 border-top">
								<div class="text-uppercase text-muted small fw-bold mb-2" style="font-size:11px;letter-spacing:.06em;">
									Setlist {#if concert.setlist?.length}<span class="fw-normal" style="text-transform:none;">({concert.setlist.length} songs)</span>{/if}
								</div>

								{#if concert.setlist?.length}
									<ol class="setlist">
										{#each concert.setlist as song, i}
											<li class="setlist-item">
												<span class="setlist-song">{song}</span>
												<button class="setlist-remove" onclick={() => removeSong(i)} title="Entfernen">✕</button>
											</li>
										{/each}
									</ol>
								{/if}

								<div class="setlist-add">
									<input
										class="form-control form-control-sm"
										type="text"
										placeholder="Song hinzufügen…"
										bind:value={newSong}
										onkeydown={(e) => e.key === 'Enter' && addSong()}
									/>
									<button class="btn btn-outline-secondary btn-sm" onclick={addSong} disabled={!newSong.trim()}>+</button>
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
						<a href="/?view=map" class="btn btn-outline-secondary w-100">View on Map</a>

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
			<a href="/" class="btn btn-primary mt-2">Back to My Concerts</a>
		</div>
	{/if}
</div>

<svelte:window onkeydown={handleKeydown} />

{#if lightboxIndex !== null}
	<div class="lightbox-overlay" onclick={closeLightbox} onkeydown={(e) => e.key === 'Escape' && closeLightbox()} role="dialog" aria-modal="true" tabindex="0">
		<button class="lightbox-close" onclick={closeLightbox} aria-label="Schließen">✕</button>

		{#if (concert?.photos?.length ?? 0) > 1}
			<button class="lightbox-nav lightbox-prev" onclick={(e) => { e.stopPropagation(); prevPhoto(); }} aria-label="Vorheriges Foto">‹</button>
		{/if}

		<img
			src={lightboxSrc}
			class="lightbox-img"
			alt=""
			onclick={(e) => e.stopPropagation()}
		/>

		{#if (concert?.photos?.length ?? 0) > 1}
			<button class="lightbox-nav lightbox-next" onclick={(e) => { e.stopPropagation(); nextPhoto(); }} aria-label="Nächstes Foto">›</button>
			<div class="lightbox-counter">{lightboxIndex + 1} / {concert.photos.length}</div>
		{/if}
	</div>
{/if}

<style>
	.detail-photo-thumb {
		background: none;
		border: none;
		padding: 0;
		display: block;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.15s;
	}
	.detail-photo-thumb:hover {
		opacity: 0.85;
		transform: scale(1.04);
	}
	.detail-photo-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.setlist {
		list-style: none;
		padding: 0;
		margin: 0 0 10px;
		counter-reset: setlist;
	}

	.setlist-item {
		counter-increment: setlist;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 10px;
		border-radius: 7px;
		transition: background 0.1s;
	}
	.setlist-item:hover { background: #f9fafb; }
	.setlist-item::before {
		content: counter(setlist);
		font-size: 11px;
		font-weight: 700;
		color: #d1d5db;
		width: 18px;
		text-align: right;
		flex-shrink: 0;
	}

	.setlist-song {
		flex: 1;
		font-size: 14px;
		color: #111827;
	}

	.setlist-remove {
		background: none;
		border: none;
		color: #e5e7eb;
		font-size: 12px;
		cursor: pointer;
		padding: 1px 5px;
		border-radius: 5px;
		line-height: 1;
		transition: color 0.1s, background 0.1s;
		opacity: 0;
	}
	.setlist-item:hover .setlist-remove { opacity: 1; }
	.setlist-remove:hover { color: #ef4444; background: #fef2f2; }

	.setlist-add {
		display: flex;
		gap: 6px;
	}

	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.9);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: zoom-out;
	}
	.lightbox-img {
		max-width: 88vw;
		max-height: 88vh;
		border-radius: 8px;
		object-fit: contain;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
		cursor: default;
	}
	.lightbox-close {
		position: absolute;
		top: 16px;
		right: 20px;
		background: rgba(255, 255, 255, 0.12);
		border: none;
		color: #fff;
		font-size: 20px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}
	.lightbox-close:hover { background: rgba(255, 255, 255, 0.25); }
	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.12);
		border: none;
		color: #fff;
		font-size: 36px;
		width: 48px;
		height: 64px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
		line-height: 1;
	}
	.lightbox-nav:hover { background: rgba(255, 255, 255, 0.28); }
	.lightbox-prev { left: 16px; }
	.lightbox-next { right: 16px; }
	.lightbox-counter {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.4);
		padding: 4px 12px;
		border-radius: 20px;
	}
</style>
