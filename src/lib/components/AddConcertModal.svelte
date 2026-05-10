<script>
	let { open = false, onclose, onadd } = $props();

	const genres = ['Pop', 'Rock', 'Metal', 'Alt-Rock', 'Alt-Pop', 'R&B', 'Electronic', 'Hip-Hop', 'Jazz', 'Classical', 'Country', 'Other'];

	let form = $state({ artist: '', venue: '', city: '', date: '', genre: 'Pop', rating: 0, notes: '' });
	let submitting = $state(false);
	let error = $state('');

	function setRating(n) { form.rating = n; }

	function reset() {
		form = { artist: '', venue: '', city: '', date: '', genre: 'Pop', rating: 0, notes: '' };
		error = '';
	}

	function close() { reset(); onclose?.(); }

	const isPast = $derived(form.date && new Date(form.date) < new Date());

	async function submit() {
		if (!form.artist.trim() || !form.venue.trim() || !form.city.trim() || !form.date) {
			error = 'Please fill in artist, venue, city and date.';
			return;
		}
		submitting = true;
		error = '';

		// City coordinate lookup — covers common concert cities across Europe and beyond
		const cityCoords = {
			// Germany
			'Berlin': [52.52, 13.41], 'Munich': [48.14, 11.58], 'Hamburg': [53.55, 9.99],
			'Frankfurt': [50.11, 8.68], 'Cologne': [50.94, 6.96], 'Stuttgart': [48.78, 9.18],
			'Düsseldorf': [51.23, 6.78], 'Leipzig': [51.34, 12.38], 'Dresden': [51.05, 13.74],
			'Hannover': [52.37, 9.73], 'Nuremberg': [49.45, 11.08], 'Mannheim': [49.49, 8.47],
			'Bremen': [53.07, 8.80], 'Dortmund': [51.51, 7.46], 'Essen': [51.46, 7.01],
			'Duisburg': [51.43, 6.76], 'Bochum': [51.48, 7.22], 'Münster': [51.96, 7.63],
			'Augsburg': [48.37, 10.90], 'Karlsruhe': [49.01, 8.40], 'Freiburg': [47.99, 7.84],

			// UK & Ireland
			'London': [51.51, -0.13], 'Manchester': [53.48, -2.24], 'Birmingham': [52.48, -1.90],
			'Glasgow': [55.86, -4.25], 'Edinburgh': [55.95, -3.19], 'Leeds': [53.80, -1.55],
			'Bristol': [51.45, -2.59], 'Liverpool': [53.40, -2.98], 'Sheffield': [53.38, -1.47],
			'Dublin': [53.33, -6.25], 'Pilton': [51.14, -2.59],

			// France
			'Paris': [48.85, 2.35], 'Lyon': [45.75, 4.83], 'Marseille': [43.30, 5.37],
			'Bordeaux': [44.84, -0.58], 'Toulouse': [43.60, 1.44], 'Nantes': [47.22, -1.55],
			'Strasbourg': [48.57, 7.75], 'Nice': [43.71, 7.26], 'Lille': [50.63, 3.06],

			// Netherlands
			'Amsterdam': [52.37, 4.90], 'Rotterdam': [51.92, 4.48], 'The Hague': [52.07, 4.30],
			'Utrecht': [52.09, 5.12], 'Eindhoven': [51.44, 5.48],

			// Belgium
			'Brussels': [50.85, 4.35], 'Antwerp': [51.22, 4.40], 'Ghent': [51.05, 3.72],
			'Bruges': [51.21, 3.22], 'Liège': [50.63, 5.57],

			// Austria
			'Vienna': [48.21, 16.37], 'Salzburg': [47.80, 13.04], 'Graz': [47.07, 15.44],
			'Innsbruck': [47.27, 11.39], 'Linz': [48.31, 14.28],

			// Switzerland
			'Zurich': [47.38, 8.54], 'Geneva': [46.20, 6.14], 'Basel': [47.56, 7.59],
			'Bern': [46.95, 7.45], 'Lausanne': [46.52, 6.63],

			// Spain
			'Madrid': [40.42, -3.70], 'Barcelona': [41.39, 2.15], 'Seville': [37.39, -5.99],
			'Valencia': [39.47, -0.37], 'Bilbao': [43.26, -2.93], 'Zaragoza': [41.65, -0.88],

			// Italy
			'Rome': [41.90, 12.50], 'Milan': [45.46, 9.19], 'Naples': [40.85, 14.27],
			'Turin': [45.07, 7.69], 'Florence': [43.77, 11.25], 'Bologna': [44.50, 11.34],
			'Venice': [45.44, 12.33],

			// Scandinavia
			'Stockholm': [59.33, 18.07], 'Oslo': [59.91, 10.75], 'Copenhagen': [55.68, 12.57],
			'Gothenburg': [57.71, 11.97], 'Helsinki': [60.17, 24.94],

			// Central & Eastern Europe
			'Prague': [50.08, 14.44], 'Warsaw': [52.23, 21.01], 'Budapest': [47.50, 19.04],
			'Krakow': [50.06, 19.94], 'Bratislava': [48.15, 17.11], 'Ljubljana': [46.05, 14.50],
			'Zagreb': [45.81, 15.98], 'Bucharest': [44.43, 26.10], 'Sofia': [42.70, 23.32],

			// Rest of Europe
			'Lisbon': [38.72, -9.14], 'Porto': [41.15, -8.61], 'Athens': [37.98, 23.73],
			'Luxembourg': [49.61, 6.13], 'Reykjavik': [64.13, -21.82],

			// North America
			'New York': [40.71, -74.01], 'Los Angeles': [34.05, -118.24], 'Chicago': [41.88, -87.63],
			'Toronto': [43.65, -79.38], 'Montreal': [45.50, -73.57], 'Vancouver': [49.25, -123.12],
			'Las Vegas': [36.17, -115.14], 'Miami': [25.77, -80.19], 'Seattle': [47.61, -122.33],
			'Austin': [30.27, -97.74], 'Nashville': [36.17, -86.78], 'Mexico City': [19.43, -99.13],

			// Rest of World
			'Tokyo': [35.69, 139.69], 'Seoul': [37.57, 126.98], 'Sydney': [-33.87, 151.21],
			'Melbourne': [-37.81, 144.96], 'São Paulo': [-23.55, -46.63],
			'Buenos Aires': [-34.60, -58.38], 'Dubai': [25.20, 55.27],
		};

		const key = Object.keys(cityCoords).find(
			(k) => k.toLowerCase() === form.city.trim().toLowerCase()
		);
		let lat = null, lng = null;
		if (key) { [lat, lng] = cityCoords[key]; }

		onadd?.({ ...form, rating: isPast ? Number(form.rating) : 0, lat, lng });
		submitting = false;
		close();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<button class="backdrop" onclick={close} aria-label="Close"></button>

	<!-- Sheet -->
	<div class="sheet" role="dialog" aria-modal="true">
		<div class="sheet-handle"></div>

		<div class="sheet-header">
			<h2>Add Concert</h2>
			<button class="close-btn" onclick={close} aria-label="Close">✕</button>
		</div>

		<div class="sheet-body">
			<label class="field">
				<span>Artist *</span>
				<input type="text" bind:value={form.artist} placeholder="e.g. Taylor Swift" />
			</label>

			<label class="field">
				<span>Venue *</span>
				<input type="text" bind:value={form.venue} placeholder="e.g. Olympiastadion" />
			</label>

			<div class="row">
				<label class="field">
					<span>City *</span>
					<input type="text" bind:value={form.city} placeholder="e.g. Munich" />
				</label>
				<label class="field">
					<span>Date *</span>
					<input type="date" bind:value={form.date} />
				</label>
			</div>

			<label class="field">
				<span>Genre</span>
				<select bind:value={form.genre}>
					{#each genres as g}<option value={g}>{g}</option>{/each}
				</select>
			</label>

			{#if isPast}
				<div class="field">
					<span>Rating</span>
					<div class="stars">
						{#each [1,2,3,4,5] as n}
							<button
								class="star"
								class:filled={n <= form.rating}
								onclick={() => setRating(n)}
								aria-label="{n} stars"
							>★</button>
						{/each}
					</div>
				</div>

				<label class="field">
					<span>Notes</span>
					<textarea bind:value={form.notes} placeholder="How was it?" rows="2"></textarea>
				</label>
			{/if}

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button class="submit-btn" onclick={submit} disabled={submitting}>
				{submitting ? 'Adding…' : 'Add Concert'}
			</button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		border: none;
		cursor: default;
		z-index: 20;
	}

	.sheet {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: #ffffff;
		border-radius: 20px 20px 0 0;
		z-index: 21;
		display: flex;
		flex-direction: column;
		max-height: 85%;
		animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1);
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to   { transform: translateY(0); }
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		background: #d1d5db;
		border-radius: 2px;
		margin: 12px auto 0;
		flex-shrink: 0;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 20px 10px;
		flex-shrink: 0;
	}

	.sheet-header h2 {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
	}

	.close-btn {
		background: #f3f4f6;
		border: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		font-size: 12px;
		color: #6b7280;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet-body {
		padding: 0 20px 24px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.field span {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field input,
	.field select,
	.field textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1.5px solid #e5e7eb;
		border-radius: 10px;
		font-size: 14px;
		color: #111827;
		background: #f9fafb;
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		border-color: #2563eb;
		background: #fff;
	}

	.field textarea {
		resize: none;
		line-height: 1.5;
	}

	.stars {
		display: flex;
		gap: 4px;
	}

	.star {
		background: none;
		border: none;
		font-size: 26px;
		cursor: pointer;
		color: #d1d5db;
		padding: 0;
		line-height: 1;
		transition: color 0.1s, transform 0.1s;
	}

	.star.filled { color: #f59e0b; }
	.star:active { transform: scale(0.9); }

	.error {
		font-size: 13px;
		color: #ef4444;
		background: #fef2f2;
		padding: 8px 12px;
		border-radius: 8px;
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		margin-top: 4px;
		transition: opacity 0.15s;
	}

	.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.submit-btn:active:not(:disabled) { opacity: 0.85; }
</style>
