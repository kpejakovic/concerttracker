<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import AddConcertModal from '$lib/components/AddConcertModal.svelte';

	let showModal = $state(false);
	let mapEl = $state(null);
	let mapInstance = $state(null);
	let markersGroup = null;
	let view = $state('list');
	let activeTab = $state('upcoming');
	let search = $state('');

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
							<div class="card-body-inner">
								<div class="d-flex justify-content-between align-items-center mb-2">
									<span class="genre-tag" style="color:{color};background:{color}1a">{concert.genre}</span>
									{#if isPast}
										{#if concert.rating}
											<span class="rating-display">
												{#each [1,2,3,4,5] as n}
													<span style="color:{n <= concert.rating ? '#f59e0b' : '#e5e7eb'}">★</span>
												{/each}
											</span>
										{:else}
											<span class="badge bg-secondary-subtle text-secondary fw-normal">Not rated</span>
										{/if}
									{:else}
										<span class="days-badge">{daysUntil(concert.date)}</span>
									{/if}
								</div>

								<h2 class="concert-artist">{concert.artist}</h2>
								<div class="concert-meta">{concert.venue} · {concert.city}</div>
								<div class="concert-date">{formatDate(concert.date)}</div>

								<div class="card-actions mt-auto pt-2">
									<a href="/concert/{concert.id}" class="detail-link">View details →</a>
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
						</div>
					</div>
				{/each}
			</div>
		{/if}
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

	.rating-display {
		font-size: 14px;
		letter-spacing: 1px;
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
</style>
