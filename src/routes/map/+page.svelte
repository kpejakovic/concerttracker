<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';

	let mapEl = $state(null);
	let mapInstance = null;

	const today = new Date();

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
	<h1 class="title">Map</h1>
	<div class="legend">
		<span class="dot upcoming"></span><span>Upcoming</span>
		<span class="dot past"></span><span>Past</span>
	</div>
</header>

<div class="map-wrap">
	<div bind:this={mapEl} class="map"></div>
</div>

<style>
	.header {
		padding: 14px 20px 12px;
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title {
		font-size: 22px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #6b7280;
		font-weight: 500;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
		margin-left: 8px;
	}
	.dot.upcoming { background: #2563eb; }
	.dot.past     { background: #6b7280; }

	.map-wrap {
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.map {
		width: 100%;
		height: 100%;
	}

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 12px !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
		padding: 0 !important;
	}
	:global(.leaflet-popup-content) {
		margin: 12px 14px !important;
	}
	:global(.leaflet-popup-tip) {
		background: white !important;
	}
</style>
