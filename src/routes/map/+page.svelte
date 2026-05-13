<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import ConcertCard from '$lib/components/ConcertCard.svelte';

	let mapEl = $state(null);
	let mapInstance = null;
	let view = $state('map');
	let activeTab = $state('upcoming');

	const today = new Date();

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

	let displayed = $derived(activeTab === 'upcoming' ? upcomingConcerts : pastConcerts);

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

			mapInstance = L.map(mapEl, { zoomControl: false }).setView([51.0, 10.5], 6);

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
				maxZoom: 19
			}).addTo(mapInstance);

			L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

			const markers = [];

			for (const concert of concertStore.items) {
				if (concert.lat == null || concert.lng == null) continue;
				const isPast = new Date(concert.date) < today;

				const marker = L.circleMarker([concert.lat, concert.lng], {
					radius: 9,
					fillColor: isPast ? '#6b7280' : '#2563eb',
					color: '#ffffff',
					weight: 2.5,
					fillOpacity: 0.9
				})
					.addTo(mapInstance)
					.bindPopup(
						`<div style="font-family:-apple-system,sans-serif;min-width:140px">
							<div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:3px">${concert.artist}</div>
							<div style="font-size:12px;color:#6b7280">${concert.venue}</div>
							<div style="font-size:12px;color:#374151;font-weight:600">${concert.city}</div>
							<div style="font-size:11px;color:#9ca3af;margin-top:4px">${new Date(concert.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
						</div>`,
						{ maxWidth: 200 }
					);

				markers.push(marker);
			}

			if (markers.length > 0) {
				const group = L.featureGroup(markers);
				mapInstance.fitBounds(group.getBounds().pad(0.25));
			}
		});

		return () => {
			destroyed = true;
			if (mapInstance) { mapInstance.remove(); mapInstance = null; }
		};
	});
</script>

<!-- Page header -->
<div class="container-xl py-3">
	<div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
		<h1 class="h4 fw-bold mb-0">My Concerts</h1>
		<div class="d-flex gap-2">
			<button
				class="btn btn-sm"
				class:btn-dark={view === 'map'}
				class:btn-outline-secondary={view !== 'map'}
				onclick={() => (view = 'map')}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
					<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
					<line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
				</svg>
				Map
			</button>
			<button
				class="btn btn-sm"
				class:btn-dark={view === 'list'}
				class:btn-outline-secondary={view !== 'list'}
				onclick={() => (view = 'list')}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
					<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
					<line x1="8" y1="18" x2="21" y2="18"/>
					<line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
					<line x1="3" y1="18" x2="3.01" y2="18"/>
				</svg>
				List
			</button>
		</div>
	</div>
</div>

<!-- Map — always in DOM so Leaflet stays initialized -->
<div class="map-outer" class:d-none={view === 'list'}>
	<div class="map-legend">
		<span class="legend-dot upcoming"></span><span>Upcoming</span>
		<span class="legend-dot past ms-2"></span><span>Past</span>
	</div>
	<div bind:this={mapEl} class="map-el"></div>
</div>

<!-- List view -->
{#if view === 'list'}
	<div class="container-xl pb-4">
		<ul class="nav nav-tabs mb-3">
			<li class="nav-item">
				<button
					class="nav-link"
					class:active={activeTab === 'upcoming'}
					onclick={() => (activeTab = 'upcoming')}
				>
					Upcoming
					<span class="badge ms-1" class:bg-primary={activeTab === 'upcoming'} class:bg-secondary={activeTab !== 'upcoming'}>{upcomingConcerts.length}</span>
				</button>
			</li>
			<li class="nav-item">
				<button
					class="nav-link"
					class:active={activeTab === 'past'}
					onclick={() => (activeTab = 'past')}
				>
					Past
					<span class="badge ms-1" class:bg-primary={activeTab === 'past'} class:bg-secondary={activeTab !== 'past'}>{pastConcerts.length}</span>
				</button>
			</li>
		</ul>

		{#if displayed.length === 0}
			<div class="text-center py-5 text-muted">
				<div class="fs-1 mb-2">{activeTab === 'upcoming' ? '🎟️' : '🎵'}</div>
				<p>{activeTab === 'upcoming' ? 'No upcoming concerts saved yet.' : 'No past concerts yet.'}</p>
			</div>
		{:else}
			<div class="row g-3">
				{#each displayed as concert (concert.id)}
					<div class="col-12 col-md-6 col-lg-4">
						<ConcertCard
							{concert}
							past={activeTab === 'past'}
							ondelete={() => concertStore.remove(concert.id)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.map-outer {
		position: relative;
		height: calc(100vh - 120px);
		min-height: 400px;
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
