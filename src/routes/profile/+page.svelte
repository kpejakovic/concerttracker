<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { browser } from '$app/environment';

	const ALL_GENRES = ['Pop', 'Rock', 'Metal', 'Alt-Rock', 'Alt-Pop', 'R&B', 'Electronic', 'Hip-Hop', 'Jazz', 'Classical', 'Country', 'Other'];
	const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

	// ── Persisted profile state ────────────────────────────────────────────────
	function load(key, fallback) {
		if (!browser) return fallback;
		const v = localStorage.getItem(key);
		if (v === null) return fallback;
		try { return JSON.parse(v); } catch { return v; }
	}
	function save(key, val) {
		if (browser) localStorage.setItem(key, JSON.stringify(val));
	}

	let name         = $state(load('profile-name', ''));
	let bio          = $state(load('profile-bio', ''));
	let homeCity     = $state(load('profile-city', ''));
	let avatarColor  = $state(load('profile-color', AVATAR_COLORS[0]));
	let favGenres    = $state(load('profile-genres', []));

	// editing toggles
	let editingName  = $state(false);
	let editingBio   = $state(false);
	let editingCity  = $state(false);

	let tmpName = $state('');
	let tmpBio  = $state('');
	let tmpCity = $state('');

	function startEdit(field) {
		if (field === 'name') { tmpName = name; editingName = true; }
		if (field === 'bio')  { tmpBio  = bio;  editingBio  = true; }
		if (field === 'city') { tmpCity = homeCity; editingCity = true; }
	}

	function commitName() { name = tmpName.trim(); save('profile-name', name); editingName = false; }
	function commitBio()  { bio  = tmpBio.trim();  save('profile-bio',  bio);  editingBio  = false; }
	function commitCity() { homeCity = tmpCity.trim(); save('profile-city', homeCity); editingCity = false; }

	function setColor(c) { avatarColor = c; save('profile-color', c); }

	function toggleGenre(g) {
		favGenres = favGenres.includes(g) ? favGenres.filter((x) => x !== g) : [...favGenres, g];
		save('profile-genres', favGenres);
	}

	let initials = $derived(
		name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?'
	);

	// ── Concert stats ─────────────────────────────────────────────────────────
	const today = new Date();
	let past     = $derived(concertStore.items.filter((c) => new Date(c.date) < today));
	let upcoming = $derived(concertStore.items.filter((c) => new Date(c.date) >= today));

	let ratedPast   = $derived(past.filter((c) => c.rating));
	let avgRating   = $derived(ratedPast.length ? (ratedPast.reduce((s, c) => s + c.rating, 0) / ratedPast.length).toFixed(1) : '—');
	let cities      = $derived([...new Set(past.map((c) => c.city))]);

	let genreMap = $derived(
		past.reduce((acc, c) => { acc[c.genre] = (acc[c.genre] ?? 0) + 1; return acc; }, {})
	);
	let topGenres = $derived(Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 6));
	let maxCount  = $derived(topGenres[0]?.[1] ?? 1);

	let yearMap  = $derived(past.reduce((acc, c) => { const y = new Date(c.date).getFullYear(); acc[y] = (acc[y] ?? 0) + 1; return acc; }, {}));
	let years    = $derived(Object.entries(yearMap).sort((a, b) => a[0] - b[0]));
	let maxYear  = $derived(Math.max(...years.map(([, v]) => v), 1));
</script>

<header class="header">
	<h1 class="title">Profile</h1>
</header>

<div class="scroll">

		<!-- ── Avatar ── -->
		<div class="avatar-section">
			<div class="avatar" style="background:{avatarColor}">{initials}</div>

			<!-- Color picker -->
			<div class="color-picker">
				{#each AVATAR_COLORS as color}
					<button
						class="swatch"
						class:active={avatarColor === color}
						style="background:{color}"
						onclick={() => setColor(color)}
						aria-label="Choose color {color}"
					></button>
				{/each}
			</div>
		</div>

		<!-- ── Name ── -->
		<div class="info-card">
			<div class="info-row">
				<span class="info-label">Name</span>
				{#if editingName}
					<div class="inline-edit">
						<input type="text" bind:value={tmpName} placeholder="Your name" onkeydown={(e) => e.key === 'Enter' && commitName()} />
						<button class="pill-btn blue" onclick={commitName}>Save</button>
						<button class="pill-btn gray" onclick={() => (editingName = false)}>Cancel</button>
					</div>
				{:else}
					<button class="edit-row" onclick={() => startEdit('name')}>
						<span class="info-value">{name || 'Add your name'}</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
					</button>
				{/if}
			</div>

			<div class="divider"></div>

			<!-- Home city -->
			<div class="info-row">
				<span class="info-label">City</span>
				{#if editingCity}
					<div class="inline-edit">
						<input type="text" bind:value={tmpCity} placeholder="Your home city" onkeydown={(e) => e.key === 'Enter' && commitCity()} />
						<button class="pill-btn blue" onclick={commitCity}>Save</button>
						<button class="pill-btn gray" onclick={() => (editingCity = false)}>Cancel</button>
					</div>
				{:else}
					<button class="edit-row" onclick={() => startEdit('city')}>
						<span class="info-value">{homeCity || 'Add home city'}</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
					</button>
				{/if}
			</div>

			<div class="divider"></div>

			<!-- Bio -->
			<div class="info-row bio-row">
				<span class="info-label">Bio</span>
				{#if editingBio}
					<div class="inline-edit col">
						<textarea bind:value={tmpBio} placeholder="Tell others about your music taste…" rows="3"></textarea>
						<div class="edit-actions">
							<button class="pill-btn blue" onclick={commitBio}>Save</button>
							<button class="pill-btn gray" onclick={() => (editingBio = false)}>Cancel</button>
						</div>
					</div>
				{:else}
					<button class="edit-row" onclick={() => startEdit('bio')}>
						<span class="info-value bio-val">{bio || 'Add a short bio'}</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- ── Stats ── -->
		<div class="stats-grid">
			<div class="stat-card">
				<span class="stat-value">{past.length}</span>
				<span class="stat-label">Attended</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{upcoming.length}</span>
				<span class="stat-label">Upcoming</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{cities.length}</span>
				<span class="stat-label">Cities</span>
			</div>
			<a href="/rate" class="stat-card clickable">
				<span class="stat-value">{avgRating}</span>
				<span class="stat-label">Avg ★</span>
				<span class="stat-hint">Rate concerts →</span>
			</a>
		</div>

		<!-- ── Favourite genres (interactive) ── -->
		<div class="section-label">Favourite Genres <span class="section-hint">tap to select</span></div>
		<div class="genre-grid">
			{#each ALL_GENRES as genre}
				{@const active = favGenres.includes(genre)}
				<button
					class="genre-chip"
					class:active
					onclick={() => toggleGenre(genre)}
				>{genre}</button>
			{/each}
		</div>

		{#if past.length > 0}
			<!-- ── Genre breakdown from history ── -->
			{#if topGenres.length > 0}
				<div class="section-label">Genres from History</div>
				<div class="bars-card">
					{#each topGenres as [genre, count]}
						<div class="bar-row">
							<span class="bar-label">{genre}</span>
							<div class="bar-track">
								<div class="bar-fill" style="width:{(count / maxCount) * 100}%"></div>
							</div>
							<span class="bar-count">{count}</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- ── Year chart ── -->
			{#if years.length > 0}
				<div class="section-label">By Year</div>
				<div class="bars-card">
					{#each years as [year, count]}
						<div class="bar-row">
							<span class="bar-label">{year}</span>
							<div class="bar-track">
								<div class="bar-fill" style="width:{(count / maxYear) * 100}%"></div>
							</div>
							<span class="bar-count">{count}</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- ── Cities visited ── -->
			{#if cities.length > 0}
				<div class="section-label">Cities Visited</div>
				<div class="chips">
					{#each cities as city}
						<span class="city-chip">{city}</span>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="empty">No past concerts yet — start tracking your shows!</div>
		{/if}

		<div class="bottom-space"></div>
	</div>

<style>
	.header {
		padding: 14px 20px 12px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}
	.title { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }

	.scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 14px; }

	/* Avatar */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.avatar {
		width: 76px;
		height: 76px;
		border-radius: 50%;
		color: #fff;
		font-size: 26px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.color-picker { display: flex; gap: 8px; }

	.swatch {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 3px solid transparent;
		cursor: pointer;
		transition: border-color 0.15s, transform 0.15s;
	}
	.swatch.active { border-color: #111827; transform: scale(1.15); }

	/* Info card */
	.info-card {
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.08);
		margin-bottom: 14px;
		overflow: hidden;
	}

	.info-row {
		padding: 12px 16px;
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}

	.info-label {
		font-size: 12px;
		font-weight: 700;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		width: 44px;
		flex-shrink: 0;
		padding-top: 2px;
	}

	.edit-row {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		gap: 8px;
		text-align: left;
	}
	.edit-row svg { width: 14px; height: 14px; color: #d1d5db; flex-shrink: 0; }

	.info-value { font-size: 14px; color: #374151; font-weight: 500; }
	.bio-val { white-space: pre-wrap; line-height: 1.5; color: #374151; }
	.bio-row { align-items: flex-start; }

	.inline-edit {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.inline-edit.col { flex-direction: column; align-items: stretch; }

	.inline-edit input,
	.inline-edit textarea {
		flex: 1;
		padding: 8px 10px;
		border: 1.5px solid #2563eb;
		border-radius: 10px;
		font-size: 14px;
		font-family: inherit;
		outline: none;
		color: #111827;
		background: #f0f4ff;
		min-width: 0;
	}
	.inline-edit textarea { resize: none; line-height: 1.5; width: 100%; }

	.edit-actions { display: flex; gap: 8px; }

	.pill-btn {
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 700;
		border: none;
		cursor: pointer;
	}
	.pill-btn.blue { background: #2563eb; color: #fff; }
	.pill-btn.gray { background: #f3f4f6; color: #6b7280; }

	.divider { height: 1px; background: #f3f4f6; margin: 0 16px; }

	/* Stats */
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 16px;
	}

	.stat-card {
		background: #fff;
		border-radius: 14px;
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.08);
	}
	.stat-value { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -1px; }
	.stat-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }

	.stat-card.clickable {
		text-decoration: none;
		cursor: pointer;
		border: 2px solid transparent;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.stat-card.clickable:active { border-color: #2563eb; box-shadow: 0 2px 12px rgba(37,99,235,0.15); }

	.stat-hint {
		font-size: 10px;
		font-weight: 600;
		color: #2563eb;
		margin-top: 2px;
	}

	/* Genre picker */
	.section-label {
		font-size: 12px;
		font-weight: 700;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.section-hint { font-size: 10px; font-weight: 400; color: #d1d5db; text-transform: none; letter-spacing: 0; }

	.genre-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}

	.genre-chip {
		padding: 7px 14px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 600;
		border: 2px solid #e5e7eb;
		color: #6b7280;
		background: #fff;
		cursor: pointer;
		transition: all 0.15s;
	}
	.genre-chip.active {
		background: #2563eb;
		border-color: #2563eb;
		color: #fff;
	}

	/* Bar charts */
	.bars-card {
		background: #fff;
		border-radius: 14px;
		padding: 14px 16px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.08);
		margin-bottom: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.bar-row { display: flex; align-items: center; gap: 10px; }
	.bar-label { font-size: 13px; font-weight: 600; color: #374151; width: 76px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.bar-track { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
	.bar-fill { height: 100%; background: #2563eb; border-radius: 4px; min-width: 4px; transition: width 0.4s ease; }
	.bar-count { font-size: 12px; font-weight: 700; color: #6b7280; width: 16px; text-align: right; }

	/* City chips */
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
	.city-chip {
		background: #fff;
		border: 1.5px solid #e5e7eb;
		color: #374151;
		font-size: 13px;
		font-weight: 600;
		padding: 5px 12px;
		border-radius: 20px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
	}

	.empty { text-align: center; color: #9ca3af; font-size: 14px; padding: 30px 20px; line-height: 1.6; }
	.bottom-space { height: 16px; }
</style>
