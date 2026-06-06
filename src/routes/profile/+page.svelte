<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { browser } from '$app/environment';

	const ALL_GENRES = ['Pop', 'Rock', 'Metal', 'Alt-Rock', 'Alt-Pop', 'R&B', 'Electronic', 'Hip-Hop', 'Jazz', 'Classical', 'Country', 'Other'];
	const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

	function getUserEmail() {
		if (!browser) return null;
		try {
			const raw = localStorage.getItem('ct-session');
			return raw ? (JSON.parse(raw).email ?? null) : null;
		} catch { return null; }
	}

	function profileKey(field) {
		const email = getUserEmail();
		return email ? `profile-${email}-${field}` : `profile-${field}`;
	}

	function load(field, fallback) {
		if (!browser) return fallback;
		const v = localStorage.getItem(profileKey(field));
		if (v === null) return fallback;
		try { return JSON.parse(v); } catch { return v; }
	}

	function save(field, val) {
		if (browser) localStorage.setItem(profileKey(field), JSON.stringify(val));
	}

	let name        = $state(load('name', ''));
	let bio         = $state(load('bio', ''));
	let homeCity    = $state(load('city', ''));
	let avatarColor = $state(load('color', AVATAR_COLORS[0]));
	let favGenres   = $state(load('genres', []));

	let editingName = $state(false);
	let editingBio  = $state(false);
	let editingCity = $state(false);

	let tmpName = $state('');
	let tmpBio  = $state('');
	let tmpCity = $state('');

	function startEdit(field) {
		if (field === 'name') { tmpName = name; editingName = true; }
		if (field === 'bio')  { tmpBio  = bio;  editingBio  = true; }
		if (field === 'city') { tmpCity = homeCity; editingCity = true; }
	}

	function commitName() { name = tmpName.trim(); save('name', name); editingName = false; }
	function commitBio()  { bio  = tmpBio.trim();  save('bio',  bio);  editingBio  = false; }
	function commitCity() { homeCity = tmpCity.trim(); save('city', homeCity); editingCity = false; }

	function setColor(c) { avatarColor = c; save('color', c); }

	function toggleGenre(g) {
		favGenres = favGenres.includes(g) ? favGenres.filter((x) => x !== g) : [...favGenres, g];
		save('genres', favGenres);
	}

	let initials = $derived(
		name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?'
	);

	const today = new Date();
	let past     = $derived(concertStore.items.filter((c) => new Date(c.date) < today));
	let upcoming = $derived(concertStore.items.filter((c) => new Date(c.date) >= today));

	let ratedPast  = $derived(past.filter((c) => c.rating));
	let avgRating  = $derived(ratedPast.length ? (ratedPast.reduce((s, c) => s + c.rating, 0) / ratedPast.length).toFixed(1) : '—');
	let cities     = $derived([...new Set(past.map((c) => c.city))]);

	let genreMap  = $derived(past.reduce((acc, c) => { acc[c.genre] = (acc[c.genre] ?? 0) + 1; return acc; }, {}));
	let topGenres = $derived(Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 6));
	let maxCount  = $derived(topGenres[0]?.[1] ?? 1);

	let yearMap = $derived(past.reduce((acc, c) => { const y = new Date(c.date).getFullYear(); acc[y] = (acc[y] ?? 0) + 1; return acc; }, {}));
	let years   = $derived(Object.entries(yearMap).sort((a, b) => a[0] - b[0]));
	let maxYear = $derived(Math.max(...years.map(([, v]) => v), 1));
</script>

<div class="container-xl py-4">
	<h1 class="h3 fw-bold mb-4">Profile</h1>

	<div class="row g-4">
		<!-- Left column: avatar + info -->
		<div class="col-12 col-lg-4">
			<!-- Avatar card -->
			<div class="card border-0 shadow-sm mb-4">
				<div class="card-body text-center py-4">
					<div
						class="avatar-circle mx-auto mb-3"
						style="background:{avatarColor}"
					>{initials}</div>
					<div class="d-flex justify-content-center gap-2 mb-2">
						{#each AVATAR_COLORS as color}
							<button
								class="swatch-btn"
								class:swatch-active={avatarColor === color}
								style="background:{color}"
								onclick={() => setColor(color)}
								aria-label="Color {color}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Info card -->
			<div class="card border-0 shadow-sm">
				<div class="card-body p-0">
					<!-- Name -->
					<div class="info-row border-bottom p-3">
						<div class="text-uppercase text-muted mb-1" style="font-size:11px;font-weight:700;letter-spacing:.05em;">Name</div>
						{#if editingName}
							<div class="d-flex gap-2 flex-wrap">
								<input class="form-control form-control-sm flex-grow-1" type="text" bind:value={tmpName} placeholder="Your name"
									onkeydown={(e) => e.key === 'Enter' && commitName()} />
								<button class="btn btn-sm btn-primary" onclick={commitName}>Save</button>
								<button class="btn btn-sm btn-secondary" onclick={() => (editingName = false)}>Cancel</button>
							</div>
						{:else}
							<button class="d-flex align-items-center justify-content-between w-100 bg-transparent border-0 p-0 text-start" onclick={() => startEdit('name')}>
								<span class="fw-medium">{name || 'Add your name'}</span>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
							</button>
						{/if}
					</div>

					<!-- City -->
					<div class="info-row border-bottom p-3">
						<div class="text-uppercase text-muted mb-1" style="font-size:11px;font-weight:700;letter-spacing:.05em;">City</div>
						{#if editingCity}
							<div class="d-flex gap-2 flex-wrap">
								<input class="form-control form-control-sm flex-grow-1" type="text" bind:value={tmpCity} placeholder="Your home city"
									onkeydown={(e) => e.key === 'Enter' && commitCity()} />
								<button class="btn btn-sm btn-primary" onclick={commitCity}>Save</button>
								<button class="btn btn-sm btn-secondary" onclick={() => (editingCity = false)}>Cancel</button>
							</div>
						{:else}
							<button class="d-flex align-items-center justify-content-between w-100 bg-transparent border-0 p-0 text-start" onclick={() => startEdit('city')}>
								<span class="fw-medium">{homeCity || 'Add home city'}</span>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
							</button>
						{/if}
					</div>

					<!-- Bio -->
					<div class="info-row p-3">
						<div class="text-uppercase text-muted mb-1" style="font-size:11px;font-weight:700;letter-spacing:.05em;">Bio</div>
						{#if editingBio}
							<textarea class="form-control form-control-sm mb-2" bind:value={tmpBio} placeholder="Tell others about your music taste…" rows="3"></textarea>
							<div class="d-flex gap-2">
								<button class="btn btn-sm btn-primary" onclick={commitBio}>Save</button>
								<button class="btn btn-sm btn-secondary" onclick={() => (editingBio = false)}>Cancel</button>
							</div>
						{:else}
							<button class="d-flex align-items-center justify-content-between w-100 bg-transparent border-0 p-0 text-start" onclick={() => startEdit('bio')}>
								<span class="fw-medium">{bio || 'Add a short bio'}</span>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2" style="flex-shrink:0;margin-left:8px;"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Right column: stats + charts -->
		<div class="col-12 col-lg-8">
			<!-- Stats grid -->
			<div class="row g-3 mb-4">
				<div class="col-6 col-sm-3">
					<div class="card border-0 shadow-sm text-center py-3">
						<div class="stat-value">{past.length}</div>
						<div class="stat-label">Attended</div>
					</div>
				</div>
				<div class="col-6 col-sm-3">
					<div class="card border-0 shadow-sm text-center py-3">
						<div class="stat-value">{upcoming.length}</div>
						<div class="stat-label">Upcoming</div>
					</div>
				</div>
				<div class="col-6 col-sm-3">
					<div class="card border-0 shadow-sm text-center py-3">
						<div class="stat-value">{cities.length}</div>
						<div class="stat-label">Cities</div>
					</div>
				</div>
				<a href="/rate" class="col-6 col-sm-3 text-decoration-none">
					<div class="card border-0 shadow-sm text-center py-3 h-100">
						<div class="stat-value">{avgRating}</div>
						<div class="stat-label">Avg ★</div>
						<div class="text-primary" style="font-size:11px;font-weight:600;">Rate concerts →</div>
					</div>
				</a>
			</div>

			<!-- Favourite genres -->
			<div class="card border-0 shadow-sm mb-4">
				<div class="card-body">
					<h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size:11px;letter-spacing:.06em;">
						Favourite Genres <span class="text-muted fw-normal" style="text-transform:none;letter-spacing:0;">— tap to select</span>
					</h6>
					<div class="d-flex flex-wrap gap-2">
						{#each ALL_GENRES as genre}
							{@const active = favGenres.includes(genre)}
							<button
								class="btn btn-sm rounded-pill fw-semibold"
								class:btn-primary={active}
								class:btn-outline-secondary={!active}
								onclick={() => toggleGenre(genre)}
							>{genre}</button>
						{/each}
					</div>
				</div>
			</div>

			{#if past.length > 0}
				<!-- Genre breakdown -->
				{#if topGenres.length > 0}
					<div class="card border-0 shadow-sm mb-4">
						<div class="card-body">
							<h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size:11px;letter-spacing:.06em;">Genres from History</h6>
							<div class="d-flex flex-column gap-2">
								{#each topGenres as [genre, count]}
									<div class="d-flex align-items-center gap-3">
										<span class="bar-label">{genre}</span>
										<div class="flex-grow-1 bg-light rounded" style="height:8px;overflow:hidden;">
											<div class="bg-primary rounded" style="height:100%;width:{(count / maxCount) * 100}%;min-width:4px;transition:width .4s;"></div>
										</div>
										<span class="text-muted fw-bold" style="font-size:12px;min-width:16px;text-align:right;">{count}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Year chart -->
				{#if years.length > 0}
					<div class="card border-0 shadow-sm mb-4">
						<div class="card-body">
							<h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size:11px;letter-spacing:.06em;">By Year</h6>
							<div class="d-flex flex-column gap-2">
								{#each years as [year, count]}
									<div class="d-flex align-items-center gap-3">
										<span class="bar-label">{year}</span>
										<div class="flex-grow-1 bg-light rounded" style="height:8px;overflow:hidden;">
											<div class="bg-primary rounded" style="height:100%;width:{(count / maxYear) * 100}%;min-width:4px;transition:width .4s;"></div>
										</div>
										<span class="text-muted fw-bold" style="font-size:12px;min-width:16px;text-align:right;">{count}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Cities visited -->
				{#if cities.length > 0}
					<div class="card border-0 shadow-sm">
						<div class="card-body">
							<h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size:11px;letter-spacing:.06em;">Cities Visited</h6>
							<div class="d-flex flex-wrap gap-2">
								{#each cities as city}
									<span class="badge rounded-pill bg-light text-dark border fw-semibold" style="font-size:13px;padding:6px 14px;">{city}</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{:else}
				<div class="text-center text-muted py-4">
					No past concerts yet — start tracking your shows!
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.avatar-circle {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		color: #fff;
		font-size: 28px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.swatch-btn {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 3px solid transparent;
		cursor: pointer;
		transition: border-color 0.15s, transform 0.15s;
	}
	.swatch-active {
		border-color: #111827;
		transform: scale(1.15);
	}

	.info-row { min-height: 48px; }

	.stat-value {
		font-size: 30px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -1px;
		line-height: 1;
	}
	.stat-label {
		font-size: 11px;
		font-weight: 600;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 4px;
	}

	.bar-label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		width: 80px;
		flex-shrink: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
