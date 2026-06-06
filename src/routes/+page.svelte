<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import AddConcertModal from '$lib/components/AddConcertModal.svelte';
	import { page } from '$app/state';

	let showModal = $state(false);
	let mapEl = $state(null);
	let mapInstance = $state(null);
	let markersGroup = null;
	let view = $state(page.url.searchParams.get('view') ?? 'list');
	let activeTab = $state('upcoming');
	let search = $state(page.url.searchParams.get('search') ?? '');

	const today = new Date();

	const genreColor = {
		Pop: '#ec4899', Rock: '#2563eb', Metal: '#ef4444',
		'Alt-Rock': '#7c3aed', 'Alt-Pop': '#0891b2', 'R&B': '#f59e0b',
		'Hip-Hop': '#16a34a', Electronic: '#06b6d4', Jazz: '#6366f1',
		Classical: '#64748b', Country: '#ca8a04', Other: '#9ca3af'
	};

	let upcomingConcerts = $derived(
		concertStore.items
			.filter((c) => new Date(c.date) >= today)
			.sort((a, b) => new Date(a.date) - new Date(b.date))
	);

	let pastConcerts = $derived(
		concertStore.items
			.filter((c) => new Date(c.date) < today)
			.sort((a, b) => new Date(b.date) - new Date(a.date))
	);

	let displayed = $derived(
		(activeTab === 'upcoming' ? upcomingConcerts : pastConcerts).filter((c) => {
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return (
				c.artist.toLowerCase().includes(q) ||
				c.city.toLowerCase().includes(q) ||
				c.venue.toLowerCase().includes(q)
			);
		})
	);

	function formatDate(d) {
		return new Date(d).toLocaleDateString('en-GB', {
			weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
		});
	}

	function daysUntil(d) {
		const diff = Math.ceil((new Date(d) - today) / (1000 * 60 * 60 * 24));
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `in ${diff} days`;
	}

	let lightboxSrc = $state(null);

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

	async function handlePhotoUpload(concertId, event) {
		const file = event.target.files?.[0];
		if (!file) return;
		const dataUrl = await compressImage(file);
		const concert = concertStore.items.find((c) => c.id === concertId);
		const photos = [...(concert?.photos ?? []), dataUrl];
		concertStore.updatePhotos(concertId, photos);
		event.target.value = '';
	}

	// Edit concert
	let editingId = $state(null);
	let editArtist = $state('');
	let editVenue = $state('');
	let editCity = $state('');
	let editDate = $state('');
	let editGenre = $state('');
	let editNotes = $state('');

	function toDateInput(dateStr) {
		try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return dateStr; }
	}

	function startEdit(concert) {
		editingId = concert.id;
		editArtist = concert.artist;
		editVenue = concert.venue;
		editCity = concert.city;
		editDate = toDateInput(concert.date);
		editGenre = concert.genre;
		editNotes = concert.notes ?? '';
	}

	function saveEdit() {
		if (!editArtist.trim() || !editingId) return;
		concertStore.update(editingId, {
			artist: editArtist.trim(),
			venue: editVenue.trim(),
			city: editCity.trim(),
			date: editDate,
			genre: editGenre,
			notes: editNotes.trim()
		});
		editingId = null;
	}

	function cancelEdit() { editingId = null; }

	// Calendar
	let calYear = $state(new Date().getFullYear());
	let calMonth = $state(new Date().getMonth());
	let selectedDay = $state(null);

	let calMonthLabel = $derived(
		new Date(calYear, calMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
	);

	function dayKey(date) {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	let calDays = $derived((() => {
		const firstOfMonth = new Date(calYear, calMonth, 1);
		const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
		const startDow = (firstOfMonth.getDay() + 6) % 7;
		const days = [];
		for (let i = startDow - 1; i >= 0; i--) {
			days.push({ date: new Date(calYear, calMonth, -i), current: false });
		}
		for (let d = 1; d <= daysInMonth; d++) {
			days.push({ date: new Date(calYear, calMonth, d), current: true });
		}
		while (days.length % 7 !== 0) {
			const last = days[days.length - 1].date;
			days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), current: false });
		}
		return days;
	})());

	let concertsByDate = $derived(
		concertStore.items.reduce((acc, c) => {
			const key = dayKey(new Date(c.date));
			(acc[key] ??= []).push(c);
			return acc;
		}, {})
	);

	function prevMonth() {
		if (calMonth === 0) { calMonth = 11; calYear--; } else calMonth--;
		selectedDay = null;
	}

	function nextMonth() {
		if (calMonth === 11) { calMonth = 0; calYear++; } else calMonth++;
		selectedDay = null;
	}

	$effect(() => {
		if (view === 'map' && mapInstance) {
			setTimeout(() => mapInstance.invalidateSize(), 10);
		}
	});

	// Effect 1: set up base map once
	$effect(() => {
		if (!mapEl) return;
		let destroyed = false;

		import('leaflet').then(({ default: L }) => {
			if (destroyed) return;

			if (!document.getElementById('leaflet-css')) {
				const link = document.createElement('link');
				link.id = 'leaflet-css';
				link.rel = 'stylesheet';
				link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
				document.head.appendChild(link);
			}

			const instance = L.map(mapEl, { zoomControl: false }).setView([51.0, 10.5], 6);
			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
				maxZoom: 19
			}).addTo(instance);
			L.control.zoom({ position: 'bottomright' }).addTo(instance);
			mapInstance = instance;
		});

		return () => {
			destroyed = true;
			if (mapInstance) { mapInstance.remove(); mapInstance = null; }
			markersGroup = null;
		};
	});

	// Effect 2: redraw markers whenever concerts or map instance change
	$effect(() => {
		const items = concertStore.items; // read synchronously → Svelte tracks this
		const map = mapInstance;          // read synchronously → Svelte tracks this
		if (!map) return;

		import('leaflet').then(({ default: L }) => {
			if (markersGroup) {
				markersGroup.clearLayers();
			} else {
				markersGroup = L.layerGroup().addTo(map);
			}

			const all = [];
			for (const concert of items) {
				if (concert.lat == null || concert.lng == null) continue;
				const isPast = new Date(concert.date) < today;
				const marker = L.circleMarker([concert.lat, concert.lng], {
					radius: 9,
					fillColor: isPast ? '#6b7280' : '#2563eb',
					color: '#ffffff',
					weight: 2.5,
					fillOpacity: 0.9
				}).bindPopup(
					`<div style="font-family:-apple-system,sans-serif;min-width:140px">
						<div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:3px">${concert.artist}</div>
						<div style="font-size:12px;color:#6b7280">${concert.venue}</div>
						<div style="font-size:12px;color:#374151;font-weight:600">${concert.city}</div>
						<div style="font-size:11px;color:#9ca3af;margin-top:4px">${new Date(concert.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
					</div>`,
					{ maxWidth: 200 }
				);
				markersGroup.addLayer(marker);
				all.push(marker);
			}

			if (all.length > 0) {
				map.fitBounds(L.featureGroup(all).getBounds().pad(0.25));
			}
		});
	});
</script>

<div class="container-xl py-4">
	<!-- Header -->
	<div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
		<div>
			<h1 class="h3 fw-bold mb-0">My Concerts</h1>
			<p class="text-muted small mb-0">
				{upcomingConcerts.length} upcoming · {pastConcerts.length} past
			</p>
		</div>
		<div class="d-flex gap-2">
			<button class="btn btn-primary btn-sm" onclick={() => (showModal = true)}>+ Add Concert</button>
			<button
				class="btn btn-sm"
				class:btn-dark={view === 'list'}
				class:btn-outline-secondary={view !== 'list'}
				onclick={() => (view = 'list')}
				title="List view"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
					<line x1="8" y1="18" x2="21" y2="18"/>
					<line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
					<line x1="3" y1="18" x2="3.01" y2="18"/>
				</svg>
			</button>
			<button
				class="btn btn-sm"
				class:btn-dark={view === 'map'}
				class:btn-outline-secondary={view !== 'map'}
				onclick={() => (view = 'map')}
				title="Map view"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
					<line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
				</svg>
			</button>
			<button
				class="btn btn-sm"
				class:btn-dark={view === 'calendar'}
				class:btn-outline-secondary={view !== 'calendar'}
				onclick={() => (view = 'calendar')}
				title="Calendar view"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
					<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- List view -->
	{#if view === 'list'}
		<!-- Search -->
		<div class="mb-3">
			<input
				class="form-control"
				type="search"
				placeholder="Search by artist, venue or city…"
				bind:value={search}
			/>
		</div>

		<!-- Tabs -->
		<ul class="nav nav-tabs mb-4">
			<li class="nav-item">
				<button
					class="nav-link"
					class:active={activeTab === 'upcoming'}
					onclick={() => (activeTab = 'upcoming')}
				>
					Upcoming
					<span class="badge ms-1" class:bg-primary={activeTab === 'upcoming'} class:bg-secondary={activeTab !== 'upcoming'}>
						{upcomingConcerts.length}
					</span>
				</button>
			</li>
			<li class="nav-item">
				<button
					class="nav-link"
					class:active={activeTab === 'past'}
					onclick={() => (activeTab = 'past')}
				>
					Past
					<span class="badge ms-1" class:bg-primary={activeTab === 'past'} class:bg-secondary={activeTab !== 'past'}>
						{pastConcerts.length}
					</span>
				</button>
			</li>
		</ul>

		<!-- Cards -->
		{#if displayed.length === 0}
			<div class="text-center py-5 text-muted">
				<div class="fs-1 mb-2">{activeTab === 'upcoming' ? '🎟️' : '🎵'}</div>
				<p>
					{search.trim()
						? 'No concerts match your search.'
						: activeTab === 'upcoming'
						? 'No upcoming concerts yet. Add one!'
						: 'No past concerts yet.'}
				</p>
			</div>
		{:else}
			<div class="row g-3">
				{#each displayed as concert (concert.id)}
					{@const color = genreColor[concert.genre] ?? '#9ca3af'}
					{@const isPast = activeTab === 'past'}
					<div class="col-12 col-md-6 col-lg-4">
						<div class="concert-card h-100">
							<div class="card-accent" style="background:{color}"></div>
							{#if editingId === concert.id}
								<!-- Edit form -->
								<div class="card-body-inner">
									<input
										class="form-control form-control-sm mb-2"
										type="text"
										placeholder="Artist"
										bind:value={editArtist}
										onkeydown={(e) => e.key === 'Enter' && saveEdit()}
									/>
									<div class="row g-1 mb-2">
										<div class="col-6">
											<input class="form-control form-control-sm" type="text" placeholder="Venue" bind:value={editVenue} />
										</div>
										<div class="col-6">
											<input class="form-control form-control-sm" type="text" placeholder="City" bind:value={editCity} />
										</div>
									</div>
									<div class="row g-1 mb-2">
										<div class="col-6">
											<input class="form-control form-control-sm" type="date" bind:value={editDate} />
										</div>
										<div class="col-6">
											<select class="form-select form-select-sm" bind:value={editGenre}>
												{#each Object.keys(genreColor) as g}
													<option value={g}>{g}</option>
												{/each}
											</select>
										</div>
									</div>
									<input
										class="form-control form-control-sm mb-3"
										type="text"
										placeholder="Notes (optional)"
										bind:value={editNotes}
									/>
									<div class="d-flex gap-2">
										<button class="btn btn-primary btn-sm flex-fill" onclick={saveEdit} disabled={!editArtist.trim()}>✓ Save</button>
										<button class="btn btn-outline-secondary btn-sm" onclick={cancelEdit}>Cancel</button>
									</div>
								</div>
							{:else}
								<!-- Normal view -->
								<div class="card-body-inner">
									<div class="d-flex justify-content-between align-items-center mb-2">
										<span class="genre-tag" style="color:{color};background:{color}1a">{concert.genre}</span>
										{#if isPast}
											<div class="stars-interactive">
												{#each [1,2,3,4,5] as n}
													<button
														class="star-btn-sm"
														onclick={() => concertStore.rate(concert.id, concert.rating === n ? 0 : n, concert.notes)}
														title="{n} star{n > 1 ? 's' : ''}"
													><span style="color:{n <= (concert.rating ?? 0) ? '#f59e0b' : '#e5e7eb'}">★</span></button>
												{/each}
											</div>
										{:else}
											<span class="days-badge">{daysUntil(concert.date)}</span>
										{/if}
									</div>

									<h2 class="concert-artist">{concert.artist}</h2>
									<div class="concert-meta">{concert.venue} · {concert.city}</div>
									<div class="concert-date">{formatDate(concert.date)}</div>

									{#if isPast && concert.photos?.length}
										<div class="photo-row">
											{#each concert.photos.slice(0, 4) as photo, i}
												<button class="photo-thumb" onclick={() => (lightboxSrc = photo)} title="Foto anzeigen">
													<img src={photo} alt="Foto {i + 1}" />
												</button>
											{/each}
											{#if concert.photos.length > 4}
												<span class="photo-more">+{concert.photos.length - 4}</span>
											{/if}
										</div>
									{/if}

									<div class="card-actions mt-auto pt-2">
										<a href="/concert/{concert.id}" class="detail-link">View details →</a>
										{#if isPast}
											<label class="photo-upload-btn" title="Foto hinzufügen">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
												<input type="file" accept="image/*" class="visually-hidden" onchange={(e) => handlePhotoUpload(concert.id, e)} />
											</label>
										{/if}
										<button class="edit-btn" onclick={() => startEdit(concert)} title="Edit">
											<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
										</button>
										<button
											class="delete-btn"
											onclick={() => {
												if (confirm(`Remove ${concert.artist} from your list?`)) {
													concertStore.remove(concert.id);
												}
											}}
											title="Remove"
										>✕</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Calendar view -->
	{#if view === 'calendar'}
		<div class="cal-wrap">
			<!-- Month navigation -->
			<div class="cal-header">
				<button class="cal-nav" onclick={prevMonth}>‹</button>
				<span class="cal-month-label">{calMonthLabel}</span>
				<button class="cal-nav" onclick={nextMonth}>›</button>
			</div>

			<!-- Weekday headers -->
			<div class="cal-grid">
				{#each ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as dow}
					<div class="cal-dow">{dow}</div>
				{/each}

				{#each calDays as day}
					{@const key = dayKey(day.date)}
					{@const concerts = concertsByDate[key] ?? []}
					{@const isToday = key === dayKey(today)}
					<button
						class="cal-day"
						class:cal-other={!day.current}
						class:cal-today={isToday}
						class:cal-selected={selectedDay === key}
						onclick={() => (selectedDay = selectedDay === key ? null : key)}
					>
						<span class="cal-num">{day.date.getDate()}</span>
						{#if concerts.length > 0}
							<div class="cal-dots">
								{#each concerts.slice(0, 3) as c}
									<span class="cal-dot" style="background:{genreColor[c.genre] ?? '#9ca3af'}"></span>
								{/each}
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Selected day detail -->
			{#if selectedDay && concertsByDate[selectedDay]?.length}
				{@const dayConcerts = concertsByDate[selectedDay]}
				<div class="cal-detail">
					<p class="cal-detail-date">
						{new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
					</p>
					{#each dayConcerts as concert}
						{@const color = genreColor[concert.genre] ?? '#9ca3af'}
						<a href="/concert/{concert.id}" class="cal-event">
							<span class="cal-event-dot" style="background:{color}"></span>
							<div>
								<div class="cal-event-artist">{concert.artist}</div>
								<div class="cal-event-venue">{concert.venue} · {concert.city}</div>
							</div>
							<span class="ms-auto" style="font-size:12px;color:{color};background:{color}1a;padding:2px 8px;border-radius:20px;font-weight:700;white-space:nowrap;">{concert.genre}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Map — kept in DOM outside container so it can fill full width/height -->
<div class="map-outer" class:d-none={view !== 'map'}>
	<div class="map-legend">
		<span class="legend-dot upcoming"></span><span>Upcoming</span>
		<span class="legend-dot past ms-2"></span><span>Past</span>
	</div>
	<div bind:this={mapEl} class="map-el"></div>
</div>

{#if lightboxSrc}
	<button class="lightbox-overlay" onclick={() => (lightboxSrc = null)}>
		<img src={lightboxSrc} class="lightbox-img" alt="" />
	</button>
{/if}

<AddConcertModal
	open={showModal}
	onclose={() => (showModal = false)}
	onadd={(concert) => concertStore.add(concert)}
/>

<style>
	/* ── Cards ─────────────────────────────────────────── */
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
		min-width: 0;
	}

	.genre-tag {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 3px 8px;
		border-radius: 20px;
		flex-shrink: 0;
	}

	.days-badge {
		font-size: 12px;
		font-weight: 700;
		color: #2563eb;
		background: #eff6ff;
		padding: 3px 8px;
		border-radius: 20px;
		white-space: nowrap;
	}

	.stars-interactive {
		display: flex;
		gap: 0;
	}

	.star-btn-sm {
		background: none;
		border: none;
		padding: 0 1px;
		cursor: pointer;
		font-size: 15px;
		line-height: 1;
		transition: transform 0.1s;
	}
	.star-btn-sm:hover span { color: #f59e0b !important; }
	.star-btn-sm:active { transform: scale(0.85); }

	.photo-row {
		display: flex;
		gap: 4px;
		margin-top: 6px;
		margin-bottom: 4px;
		flex-wrap: wrap;
	}

	.photo-thumb {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 5px;
		overflow: hidden;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}
	.photo-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.photo-thumb:hover { opacity: 0.8; }

	.photo-more {
		width: 44px;
		height: 44px;
		border-radius: 5px;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
	}

	.photo-upload-btn {
		background: none;
		border: none;
		color: #9ca3af;
		padding: 2px 6px;
		border-radius: 6px;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
		display: flex;
		align-items: center;
	}
	.photo-upload-btn:hover {
		color: #2563eb;
		background: #eff6ff;
	}

	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.88);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: zoom-out;
		padding: 0;
	}
	.lightbox-img {
		max-width: 90vw;
		max-height: 90vh;
		border-radius: 8px;
		object-fit: contain;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
	}

	.concert-artist {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.concert-meta {
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.concert-date {
		font-size: 12px;
		color: #9ca3af;
	}

	.card-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.detail-link {
		font-size: 13px;
		font-weight: 600;
		color: #2563eb;
		text-decoration: none;
	}
	.detail-link:hover { text-decoration: underline; }

	.delete-btn {
		background: none;
		border: none;
		color: #d1d5db;
		font-size: 14px;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 6px;
		transition: color 0.15s, background 0.15s;
		line-height: 1;
	}
	.delete-btn:hover {
		color: #ef4444;
		background: #fef2f2;
	}

	.edit-btn {
		background: none;
		border: none;
		color: #d1d5db;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.edit-btn:hover {
		color: #2563eb;
		background: #eff6ff;
	}

	/* ── Map ────────────────────────────────────────────── */
	.map-outer {
		position: relative;
		height: calc(100vh - 130px);
		min-height: 500px;
	}

	.map-el {
		width: 100%;
		height: 100%;
	}

	.map-legend {
		position: absolute;
		top: 12px;
		left: 12px;
		z-index: 999;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 10px;
		padding: 6px 14px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: #6b7280;
		font-weight: 500;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}
	.legend-dot.upcoming { background: #2563eb; }
	.legend-dot.past { background: #6b7280; }

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 12px !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
		padding: 0 !important;
	}
	:global(.leaflet-popup-content) { margin: 12px 14px !important; }
	:global(.leaflet-popup-tip) { background: white !important; }

	/* ── Calendar ───────────────────────────────────────── */
	.cal-wrap {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
		padding: 20px 20px 4px;
	}

	.cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.cal-nav {
		background: none;
		border: none;
		font-size: 24px;
		color: #374151;
		cursor: pointer;
		padding: 2px 12px;
		border-radius: 8px;
		transition: background 0.12s;
		line-height: 1;
	}
	.cal-nav:hover { background: #f3f4f6; }

	.cal-month-label {
		font-weight: 700;
		font-size: 17px;
		color: #111827;
	}

	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.cal-dow {
		text-align: center;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
		padding: 4px 0 10px;
	}

	.cal-day {
		background: none;
		border: none;
		border-radius: 8px;
		padding: 6px 2px 8px;
		cursor: pointer;
		min-height: 54px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		transition: background 0.12s;
	}
	.cal-day:hover { background: #f3f4f6; }

	.cal-num {
		font-size: 13px;
		font-weight: 500;
		color: #374151;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.cal-other .cal-num { color: #d1d5db; }

	.cal-today .cal-num {
		background: #2563eb;
		color: #fff;
		font-weight: 700;
	}

	.cal-selected { background: #eff6ff !important; }

	.cal-dots {
		display: flex;
		gap: 3px;
	}

	.cal-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		display: inline-block;
	}

	.cal-detail {
		border-top: 1px solid #f3f4f6;
		margin-top: 12px;
		padding: 16px 0 16px;
	}

	.cal-detail-date {
		font-size: 13px;
		font-weight: 700;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 10px;
	}

	.cal-event {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		text-decoration: none;
		background: #f9fafb;
		margin-bottom: 6px;
		transition: background 0.12s;
	}
	.cal-event:hover { background: #f3f4f6; }

	.cal-event-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.cal-event-artist {
		font-weight: 600;
		color: #111827;
		font-size: 14px;
		line-height: 1.2;
	}

	.cal-event-venue {
		font-size: 12px;
		color: #6b7280;
	}
</style>
