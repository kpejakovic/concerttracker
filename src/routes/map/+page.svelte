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

<header class="header">
	<h1 class="title">Your Concerts</h1>
	<div class="toggle">
		<button class="toggle-btn" class:active={view === 'map'} onclick={() => (view = 'map')}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
				<line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
			</svg>
			Map
		</button>
		<button class="toggle-btn" class:active={view === 'list'} onclick={() => (view = 'list')}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
				<line x1="8" y1="18" x2="21" y2="18"/>
				<line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
				<line x1="3" y1="18" x2="3.01" y2="18"/>
			</svg>
			List
		</button>
	</div>
</header>

<!-- Map — always in DOM so Leaflet stays initialized -->
<div class="map-wrap" class:hidden={view === 'list'}>
	{#if view === 'map'}
		<div class="legend">
			<span class="dot upcoming"></span><span>Upcoming</span>
			<span class="dot past"></span><span>Past</span>
		</div>
	{/if}
	<div bind:this={mapEl} class="map"></div>
</div>

<!-- List view -->
{#if view === 'list'}
	<nav class="tabs">
		<button class="tab" class:active={activeTab === 'upcoming'} onclick={() => (activeTab = 'upcoming')}>
			Upcoming <span class="tab-count">{upcomingConcerts.length}</span>
		</button>
		<button class="tab" class:active={activeTab === 'past'} onclick={() => (activeTab = 'past')}>
			Past <span class="tab-count">{pastConcerts.length}</span>
		</button>
	</nav>
	<main class="list">
		{#if displayed.length === 0}
			<div class="empty">
				<span class="empty-icon">{activeTab === 'upcoming' ? '🎟️' : '🎵'}</span>
				<p>{activeTab === 'upcoming' ? 'No upcoming concerts saved yet.' : 'No past concerts yet.'}</p>
			</div>
		{:else}
			{#each displayed as concert (concert.id)}
				<ConcertCard
					{concert}
					past={activeTab === 'past'}
					ondelete={() => concertStore.remove(concert.id)}
				/>
			{/each}
		{/if}
	</main>
{/if}

<style>
	.header {
		padding: 12px 16px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title {
		font-size: 20px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
	}

	.toggle {
		display: flex;
		background: #f3f4f6;
		border-radius: 10px;
		padding: 2px;
		gap: 2px;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		border-radius: 8px;
		border: none;
		background: transparent;
		font-size: 12px;
		font-weight: 600;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.toggle-btn svg { width: 13px; height: 13px; }
	.toggle-btn.active {
		background: #fff;
		color: #111827;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	/* Map */
	.map-wrap {
		flex: 1;
		overflow: hidden;
		min-height: 0;
		position: relative;
	}
	.map-wrap.hidden { display: none; }

	.map { width: 100%; height: 100%; }

	.legend {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 999;
		background: rgba(255,255,255,0.92);
		border-radius: 10px;
		padding: 6px 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #6b7280;
		font-weight: 500;
		box-shadow: 0 1px 6px rgba(0,0,0,0.1);
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
		margin-left: 6px;
	}
	.dot:first-child { margin-left: 0; }
	.dot.upcoming { background: #2563eb; }
	.dot.past     { background: #6b7280; }

	/* List */
	.tabs {
		display: flex;
		padding: 0 20px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 12px 0;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		color: #9ca3af;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}
	.tab.active { color: #111827; border-bottom-color: #2563eb; }

	.tab-count {
		font-size: 11px;
		font-weight: 700;
		background: #f3f4f6;
		color: #9ca3af;
		padding: 1px 7px;
		border-radius: 20px;
	}
	.tab.active .tab-count { background: #dbeafe; color: #2563eb; }

	.list {
		flex: 1;
		padding: 14px 14px 20px;
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
		line-height: 1.5;
	}
	.empty-icon { font-size: 32px; }

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 12px !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
		padding: 0 !important;
	}
	:global(.leaflet-popup-content) { margin: 12px 14px !important; }
	:global(.leaflet-popup-tip) { background: white !important; }
</style>
