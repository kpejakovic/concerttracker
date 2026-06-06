<script>
	import { artistStore } from '$lib/stores/artists.svelte.js';
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { onMount } from 'svelte';

	onMount(() => artistStore.syncWithServer());

	const genres = [
		'Pop', 'Rock', 'Metal', 'Alt-Rock', 'Alt-Pop',
		'R&B', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'Other'
	];

	const genreColor = {
		Pop: '#ec4899', Rock: '#2563eb', Metal: '#ef4444',
		'Alt-Rock': '#7c3aed', 'Alt-Pop': '#0891b2', 'R&B': '#f59e0b',
		'Hip-Hop': '#16a34a', Electronic: '#06b6d4', Jazz: '#6366f1',
		Classical: '#64748b', Country: '#ca8a04', Other: '#9ca3af'
	};

	let showForm = $state(false);
	let newName = $state('');
	let newGenre = $state('');
	let newNotes = $state('');
	let newSpotify = $state('');
	let newAppleMusic = $state('');
	let search = $state('');

	let editingId = $state(null);
	let editName = $state('');
	let editGenre = $state('');
	let editNotes = $state('');
	let editSpotify = $state('');
	let editAppleMusic = $state('');

	function startEdit(artist) {
		editingId = artist.id;
		editName = artist.name;
		editGenre = artist.genre ?? '';
		editNotes = artist.notes ?? '';
		editSpotify = artist.spotify ?? '';
		editAppleMusic = artist.appleMusic ?? '';
	}

	function saveEdit() {
		if (!editName.trim()) return;
		artistStore.update(editingId, {
			name: editName.trim(),
			genre: editGenre || null,
			notes: editNotes.trim() || null,
			spotify: editSpotify.trim() || null,
			appleMusic: editAppleMusic.trim() || null
		});
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	let grouped = $derived((() => {
		const filtered = artistStore.items
			.filter((a) => !search.trim() || a.name.toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => a.name.localeCompare(b.name));

		const map = {};
		for (const artist of filtered) {
			const letter = artist.name[0].toUpperCase();
			(map[letter] ??= []).push(artist);
		}
		return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
	})());

	function concertCount(artistName) {
		return concertStore.items.filter(
			(c) => c.artist.toLowerCase() === artistName.toLowerCase()
		).length;
	}

	function addArtist() {
		if (!newName.trim()) return;
		artistStore.add({
			name: newName.trim(),
			genre: newGenre || null,
			notes: newNotes.trim() || null,
			spotify: newSpotify.trim() || null,
			appleMusic: newAppleMusic.trim() || null
		});
		newName = '';
		newGenre = '';
		newNotes = '';
		newSpotify = '';
		newAppleMusic = '';
		showForm = false;
	}

	function cancelForm() {
		newName = '';
		newGenre = '';
		newNotes = '';
		newSpotify = '';
		newAppleMusic = '';
		showForm = false;
	}
</script>

<div class="container-xl py-4">
	<!-- Header -->
	<div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
		<div>
			<h1 class="h3 fw-bold mb-0">Favorite Artists</h1>
			<p class="text-muted small mb-0">{artistStore.items.length} saved</p>
		</div>
		{#if !showForm}
			<button class="btn btn-primary btn-sm" onclick={() => (showForm = true)}>+ Add Artist</button>
		{/if}
	</div>

	<!-- Add form -->
	{#if showForm}
		<div class="add-form mb-4">
			<div class="row g-2 align-items-end">
				<div class="col-12 col-sm-4">
					<label class="form-label small fw-semibold text-muted mb-1">Artist name *</label>
					<input
						class="form-control"
						type="text"
						placeholder="e.g. Radiohead"
						bind:value={newName}
						onkeydown={(e) => e.key === 'Enter' && addArtist()}
						autofocus
					/>
				</div>
				<div class="col-12 col-sm-3">
					<label class="form-label small fw-semibold text-muted mb-1">Genre</label>
					<select class="form-select" bind:value={newGenre}>
						<option value="">— pick genre —</option>
						{#each genres as g}
							<option value={g}>{g}</option>
						{/each}
					</select>
				</div>
				<div class="col-12 col-sm-3">
					<label class="form-label small fw-semibold text-muted mb-1">Notes</label>
					<input
						class="form-control"
						type="text"
						placeholder="Optional note…"
						bind:value={newNotes}
						onkeydown={(e) => e.key === 'Enter' && addArtist()}
					/>
				</div>
				<div class="col-12 col-sm-2 d-flex gap-2">
					<button class="btn btn-primary flex-fill" onclick={addArtist} disabled={!newName.trim()}>Add</button>
					<button class="btn btn-outline-secondary" onclick={cancelForm}>✕</button>
				</div>
				<div class="col-12 col-sm-6">
					<label class="form-label small fw-semibold text-muted mb-1">Spotify URL</label>
					<input
						class="form-control"
						type="url"
						placeholder="https://open.spotify.com/artist/…"
						bind:value={newSpotify}
					/>
				</div>
				<div class="col-12 col-sm-6">
					<label class="form-label small fw-semibold text-muted mb-1">Apple Music URL</label>
					<input
						class="form-control"
						type="url"
						placeholder="https://music.apple.com/…"
						bind:value={newAppleMusic}
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Search -->
	{#if artistStore.items.length > 0}
		<div class="mb-4">
			<input class="form-control" type="search" placeholder="Search artists…" bind:value={search} />
		</div>
	{/if}

	<!-- Empty state -->
	{#if artistStore.items.length === 0}
		<div class="text-center py-5 text-muted">
			<div class="fs-1 mb-2">🎤</div>
			<p class="mb-3">No favorite artists yet.<br />Add the artists you love!</p>
			{#if !showForm}
				<button class="btn btn-primary" onclick={() => (showForm = true)}>+ Add Artist</button>
			{/if}
		</div>
	{:else if grouped.length === 0}
		<div class="text-center py-5 text-muted">
			<p>No artists match your search.</p>
		</div>
	{:else}
		<div class="artist-list">
			{#each grouped as [letter, artists]}
				<!-- Letter header -->
				<div class="letter-header">{letter}</div>

				{#each artists as artist (artist.id)}
					{@const color = genreColor[artist.genre] ?? '#9ca3af'}
					{@const count = concertCount(artist.name)}

					{#if editingId === artist.id}
						<!-- Edit row -->
						<div class="edit-row">
							<div class="row g-2 align-items-end">
								<div class="col-12 col-sm-3">
									<label class="form-label small fw-semibold text-muted mb-1">Name *</label>
									<input class="form-control form-control-sm" type="text" bind:value={editName} onkeydown={(e) => e.key === 'Enter' && saveEdit()} />
								</div>
								<div class="col-6 col-sm-2">
									<label class="form-label small fw-semibold text-muted mb-1">Genre</label>
									<select class="form-select form-select-sm" bind:value={editGenre}>
										<option value="">—</option>
										{#each genres as g}<option value={g}>{g}</option>{/each}
									</select>
								</div>
								<div class="col-6 col-sm-2">
									<label class="form-label small fw-semibold text-muted mb-1">Notes</label>
									<input class="form-control form-control-sm" type="text" bind:value={editNotes} />
								</div>
								<div class="col-12 col-sm-2">
									<label class="form-label small fw-semibold text-muted mb-1">Spotify</label>
									<input class="form-control form-control-sm" type="url" placeholder="https://open.spotify.com/…" bind:value={editSpotify} />
								</div>
								<div class="col-12 col-sm-2">
									<label class="form-label small fw-semibold text-muted mb-1">Apple Music</label>
									<input class="form-control form-control-sm" type="url" placeholder="https://music.apple.com/…" bind:value={editAppleMusic} />
								</div>
								<div class="col-12 col-sm-1 d-flex gap-1">
									<button class="btn btn-primary btn-sm flex-fill" onclick={saveEdit} disabled={!editName.trim()}>✓</button>
									<button class="btn btn-outline-secondary btn-sm" onclick={cancelEdit}>✕</button>
								</div>
							</div>
						</div>
					{:else}
						<!-- Display row -->
						<div class="artist-row">
							<div class="avatar" style="background:{color}22;color:{color}">
								{artist.name[0].toUpperCase()}
							</div>

							<div class="artist-info">
								<span class="artist-name">{artist.name}</span>
								{#if artist.notes}
									<span class="artist-notes">{artist.notes}</span>
								{/if}
							</div>

							{#if artist.genre}
								<span class="genre-pill" style="color:{color};background:{color}18">{artist.genre}</span>
							{/if}

							{#if artist.spotify}
								<a href={artist.spotify} target="_blank" rel="noopener" class="stream-link spotify" title="Auf Spotify öffnen">
									<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
									Spotify
								</a>
							{/if}
							{#if artist.appleMusic}
								<a href={artist.appleMusic} target="_blank" rel="noopener" class="stream-link apple" title="Auf Apple Music öffnen">
									<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a4.93 4.93 0 00-.31 1.248c-.078.528-.113 1.06-.154 1.593-.006.085-.01.17-.013.254v12.29c.01.182.02.364.038.545.062.712.196 1.405.49 2.054.657 1.46 1.77 2.41 3.333 2.795.52.127 1.052.187 1.59.218.523.031 1.048.034 1.573.034h10.01c.49 0 .98-.01 1.47-.03.55-.028 1.095-.082 1.63-.236 1.395-.4 2.44-1.234 3.095-2.54.33-.658.476-1.364.54-2.082.046-.507.063-1.018.066-1.528V6.124zm-7.27 9.41l-3.5 2.02a.96.96 0 01-1.44-.83V7.26a.96.96 0 011.44-.83l3.5 2.02 3.5 2.02a.96.96 0 010 1.66l-3.5 2.02z"/></svg>
									Apple Music
								</a>
							{/if}

							{#if count > 0}
								<a href="/?search={encodeURIComponent(artist.name)}" class="concerts-link">
									🎟 {count}
								</a>
							{:else}
								<span class="concerts-empty">—</span>
							{/if}

							<button class="edit-btn" onclick={() => startEdit(artist)} title="Bearbeiten">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							</button>
							<button class="delete-btn" onclick={() => { if (confirm(`Remove ${artist.name}?`)) artistStore.remove(artist.id); }} title="Remove">✕</button>
						</div>
					{/if}
				{/each}
			{/each}
		</div>
	{/if}
</div>

<style>
	.add-form {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
	}

	.artist-list {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.letter-header {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #9ca3af;
		padding: 10px 20px 6px;
		background: #f9fafb;
		border-top: 1px solid #f3f4f6;
	}
	.letter-header:first-child {
		border-top: none;
	}

	.artist-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 20px;
		border-bottom: 1px solid #f3f4f6;
		transition: background 0.12s;
	}
	.artist-row:last-child { border-bottom: none; }
	.artist-row:hover { background: #f9fafb; }

	.avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 15px;
		font-weight: 800;
		flex-shrink: 0;
	}

	.artist-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.artist-name {
		font-size: 15px;
		font-weight: 600;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist-notes {
		font-size: 12px;
		color: #9ca3af;
		font-style: italic;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.genre-pill {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		border-radius: 20px;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.stream-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		font-weight: 700;
		padding: 3px 9px;
		border-radius: 20px;
		text-decoration: none;
		flex-shrink: 0;
		white-space: nowrap;
		transition: opacity 0.12s;
	}
	.stream-link:hover { opacity: 0.8; }
	.stream-link.spotify { background: #1DB954; color: #fff; }
	.stream-link.apple   { background: #fc3c44; color: #fff; }

	.concerts-link {
		font-size: 12px;
		font-weight: 600;
		color: #2563eb;
		background: #eff6ff;
		padding: 3px 8px;
		border-radius: 20px;
		text-decoration: none;
		flex-shrink: 0;
		white-space: nowrap;
		transition: background 0.12s;
	}
	.concerts-link:hover { background: #dbeafe; }

	.concerts-empty {
		font-size: 13px;
		color: #d1d5db;
		flex-shrink: 0;
		width: 28px;
		text-align: center;
	}

	.edit-row {
		padding: 12px 20px;
		background: #f8faff;
		border-bottom: 1px solid #e0e7ff;
	}

	.edit-btn {
		background: none;
		border: none;
		color: #d1d5db;
		padding: 3px 6px;
		border-radius: 6px;
		cursor: pointer;
		transition: color 0.12s, background 0.12s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}
	.edit-btn:hover {
		color: #2563eb;
		background: #eff6ff;
	}

	.delete-btn {
		background: none;
		border: none;
		color: #d1d5db;
		font-size: 13px;
		cursor: pointer;
		padding: 3px 6px;
		border-radius: 6px;
		transition: color 0.12s, background 0.12s;
		flex-shrink: 0;
		line-height: 1;
	}
	.delete-btn:hover {
		color: #ef4444;
		background: #fef2f2;
	}
</style>
