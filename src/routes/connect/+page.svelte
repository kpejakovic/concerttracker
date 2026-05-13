<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { browser } from '$app/environment';

	const mockUsers = {
		6:  ['Sarah M.', 'Max K.', 'Julia R.', 'Tom B.', 'Anna S.'],
		7:  ['Felix H.', 'Lisa N.', 'David P.'],
		8:  ['Emma W.', 'Chris L.', 'Mia B.', 'Jan F.', 'Sophie T.', 'Noah G.'],
		9:  ['Lena K.', 'Paul S.']
	};

	const seedMessages = {
		6: [
			{ id: 1, user: 'Sarah M.', text: "Anyone else going on June 20? So hyped 🤘", timeStr: '2d ago' },
			{ id: 2, user: 'Max K.', text: "YES. Section C here!", timeStr: '2d ago' },
			{ id: 3, user: 'Anna S.', text: "We're doing pre-drinks near the stadium, DM me", timeStr: '1d ago' },
			{ id: 4, user: 'Tom B.', text: "Any tips on parking around there?", timeStr: '1d ago' },
			{ id: 5, user: 'Julia R.', text: "@Tom public transport is way better, trust me", timeStr: '23h ago' }
		],
		7: [
			{ id: 1, user: 'Felix H.', text: "Dua Lipa Hamburg!! 🎶", timeStr: '3d ago' },
			{ id: 2, user: 'Lisa N.', text: "Can't believe she's finally touring again", timeStr: '3d ago' },
			{ id: 3, user: 'David P.', text: "Standing or seated? I have floor tickets", timeStr: '1d ago' }
		],
		8: [
			{ id: 1, user: 'Emma W.', text: "The Weeknd 😭 I've been waiting for this tour for 3 years", timeStr: '5d ago' },
			{ id: 2, user: 'Chris L.', text: "Same!! Anyone know the setlist from other dates?", timeStr: '5d ago' },
			{ id: 3, user: 'Mia B.', text: "Blinding Lights is always in there lol", timeStr: '4d ago' },
			{ id: 4, user: 'Noah G.', text: "Gates open at 17:00 btw", timeStr: '2d ago' },
			{ id: 5, user: 'Sophie T.', text: "Thanks! Anyone forming a group to go together?", timeStr: '1d ago' }
		],
		9: [
			{ id: 1, user: 'Lena K.', text: "Radiohead at Zitadelle is going to be special", timeStr: '1d ago' },
			{ id: 2, user: 'Paul S.', text: "The venue is magical for that kind of show", timeStr: '20h ago' }
		]
	};

	const today = new Date();

	let view = $state('list');
	let selectedConcert = $state(null);

	let joined = $state(
		new Set(browser ? JSON.parse(localStorage.getItem('connect-joined') ?? '[]') : [])
	);

	function persistJoined() {
		if (browser) localStorage.setItem('connect-joined', JSON.stringify([...joined]));
	}

	function toggleJoin(id) {
		if (joined.has(id)) joined.delete(id);
		else joined.add(id);
		joined = new Set(joined);
		persistJoined();
	}

	function openChat(concert) {
		selectedConcert = concert;
		view = 'chat';
	}

	function closeChat() {
		view = 'list';
		selectedConcert = null;
	}

	let chatInput = $state('');
	let messagesEl = $state(null);

	function loadMessages(concertId) {
		const seed = (seedMessages[concertId] ?? []).map((m) => ({ ...m, mine: false }));
		const stored = browser
			? JSON.parse(localStorage.getItem(`chat-${concertId}`) ?? '[]')
			: [];
		return [...seed, ...stored].sort((a, b) => a.id - b.id);
	}

	let messages = $state([]);

	$effect(() => {
		if (selectedConcert) messages = loadMessages(selectedConcert.id);
	});

	$effect(() => {
		if (messagesEl && messages.length) {
			setTimeout(() => { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; }, 0);
		}
	});

	function sendMessage() {
		const text = chatInput.trim();
		if (!text || !selectedConcert) return;

		const msg = { id: Date.now(), user: 'You', text, timeStr: 'now', mine: true };
		messages = [...messages, msg];
		chatInput = '';

		const stored = browser
			? JSON.parse(localStorage.getItem(`chat-${selectedConcert.id}`) ?? '[]')
			: [];
		stored.push(msg);
		if (browser) localStorage.setItem(`chat-${selectedConcert.id}`, JSON.stringify(stored));
	}

	function onKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
	}

	let upcomingConcerts = $derived(
		concertStore.items
			.filter((c) => new Date(c.date) >= today)
			.sort((a, b) => new Date(a.date) - new Date(b.date))
	);

	function attendeeCount(id) {
		const base = (mockUsers[id] ?? []).length;
		return joined.has(id) ? base + 1 : base;
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: 'numeric', month: 'short', year: 'numeric'
		});
	}
</script>

<div class="container-xl py-4">
	{#if view === 'list'}
		<div class="mb-4">
			<h1 class="h3 fw-bold mb-1">Connect</h1>
			<p class="text-muted mb-0">Find people going to the same shows</p>
		</div>

		{#if upcomingConcerts.length === 0}
			<div class="text-center py-5 text-muted">
				<div class="fs-1 mb-2">🎟️</div>
				<p>No upcoming concerts. Add some on the Explore page!</p>
			</div>
		{:else}
			<div class="row g-3">
				{#each upcomingConcerts as concert (concert.id)}
					{@const count = attendeeCount(concert.id)}
					{@const isJoined = joined.has(concert.id)}
					<div class="col-12 col-md-6 col-lg-4">
						<div class="card border-0 shadow-sm h-100">
							<div class="card-body">
								<div class="d-flex justify-content-between align-items-start mb-2">
									<div class="flex-grow-1 min-w-0 me-3">
										<h5 class="fw-bold mb-1 text-truncate">{concert.artist}</h5>
										<div class="text-muted small">{concert.venue} · {concert.city}</div>
										<div class="text-muted" style="font-size:12px;">{formatDate(concert.date)}</div>
									</div>
									<div class="text-center flex-shrink-0">
										<div class="fw-bold text-primary" style="font-size:22px;line-height:1;">{count}</div>
										<div class="text-muted" style="font-size:11px;font-weight:600;">going</div>
									</div>
								</div>

								<!-- Mini avatars -->
								<div class="d-flex align-items-center gap-2 mb-3">
									<div class="avatars-row">
										{#each (mockUsers[concert.id] ?? []).slice(0, 4) as name}
											<div class="mini-avatar" title={name}>{name[0]}</div>
										{/each}
										{#if isJoined}
											<div class="mini-avatar you" title="You">Y</div>
										{/if}
									</div>
								</div>

								<div class="d-flex gap-2">
									<button
										class="btn btn-sm flex-grow-1"
										class:btn-primary={isJoined}
										class:btn-outline-primary={!isJoined}
										onclick={() => toggleJoin(concert.id)}
									>
										{isJoined ? '✓ Going' : '+ Join'}
									</button>
									<button class="btn btn-sm btn-outline-secondary" onclick={() => openChat(concert)}>
										Chat →
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	{:else}
		<!-- Chat view -->
		<div class="row justify-content-center">
			<div class="col-12 col-lg-8 col-xl-6">
				<div class="card border-0 shadow-sm" style="height:calc(100vh - 160px);display:flex;flex-direction:column;">
					<div class="card-header bg-white d-flex align-items-center gap-3">
						<button class="btn btn-sm btn-outline-secondary rounded-circle" onclick={closeChat} style="width:34px;height:34px;padding:0;">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M15 18l-6-6 6-6"/>
							</svg>
						</button>
						<div>
							<div class="fw-bold">{selectedConcert?.artist}</div>
							<div class="text-muted small">{selectedConcert?.city} · {attendeeCount(selectedConcert?.id)} going</div>
						</div>
					</div>

					<div class="card-body overflow-auto d-flex flex-column gap-3 py-3" bind:this={messagesEl}>
						{#each messages as msg (msg.id)}
							<div class="d-flex align-items-end gap-2" class:flex-row-reverse={msg.mine}>
								{#if !msg.mine}
									<div class="mini-avatar flex-shrink-0">{msg.user[0]}</div>
								{/if}
								<div class="d-flex flex-column" class:align-items-end={msg.mine} style="max-width:70%;">
									{#if !msg.mine}
										<span class="text-muted mb-1" style="font-size:11px;font-weight:600;">{msg.user}</span>
									{/if}
									<div
										class="px-3 py-2 rounded-3"
										style="{msg.mine
											? 'background:#2563eb;color:#fff;border-radius:16px 16px 4px 16px !important;'
											: 'background:#f3f4f6;color:#111827;border-radius:16px 16px 16px 4px !important;'}
											font-size:14px;line-height:1.4;"
									>{msg.text}</div>
									<span class="text-muted mt-1" style="font-size:10px;">{msg.timeStr}</span>
								</div>
							</div>
						{/each}
					</div>

					<div class="card-footer bg-white d-flex gap-2 align-items-center">
						<input
							type="text"
							class="form-control rounded-pill"
							bind:value={chatInput}
							placeholder="Message…"
							onkeydown={onKeydown}
						/>
						<button
							class="btn btn-primary rounded-circle flex-shrink-0"
							style="width:40px;height:40px;padding:0;"
							onclick={sendMessage}
							disabled={!chatInput.trim()}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.avatars-row {
		display: flex;
	}

	.mini-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #dbeafe;
		color: #2563eb;
		font-size: 11px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: -6px;
		border: 2px solid #fff;
		flex-shrink: 0;
	}
	.mini-avatar:first-child { margin-left: 0; }
	.mini-avatar.you { background: #2563eb; color: #fff; }
</style>
