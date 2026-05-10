<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { browser } from '$app/environment';

	// ── Mock community data ────────────────────────────────────────────────────
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

	// ── State ──────────────────────────────────────────────────────────────────
	const today = new Date();

	let view = $state('list'); // 'list' | 'chat'
	let selectedConcert = $state(null);

	// which concert ids the user has joined
	let joined = $state(
		new Set(browser ? JSON.parse(localStorage.getItem('connect-joined') ?? '[]') : [])
	);

	function persistJoined() {
		if (browser) localStorage.setItem('connect-joined', JSON.stringify([...joined]));
	}

	function toggleJoin(id) {
		if (joined.has(id)) joined.delete(id);
		else joined.add(id);
		joined = new Set(joined); // trigger reactivity
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

	// ── Chat logic ─────────────────────────────────────────────────────────────
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
			// scroll to bottom when messages change
			setTimeout(() => { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; }, 0);
		}
	});

	function sendMessage() {
		const text = chatInput.trim();
		if (!text || !selectedConcert) return;

		const msg = { id: Date.now(), user: 'You', text, timeStr: 'now', mine: true };
		messages = [...messages, msg];
		chatInput = '';

		// persist user messages only
		const stored = browser
			? JSON.parse(localStorage.getItem(`chat-${selectedConcert.id}`) ?? '[]')
			: [];
		stored.push(msg);
		if (browser) localStorage.setItem(`chat-${selectedConcert.id}`, JSON.stringify(stored));
	}

	function onKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
	}

	// ── Derived ────────────────────────────────────────────────────────────────
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

{#if view === 'list'}
	<!-- ── Concert list ── -->
	<header class="header">
		<h1 class="title">Connect</h1>
		<p class="subtitle">Find people going to the same shows</p>
	</header>

	<div class="list">
		{#if upcomingConcerts.length === 0}
			<div class="empty">No upcoming concerts. Add some on the Home tab!</div>
		{:else}
			{#each upcomingConcerts as concert (concert.id)}
				{@const count = attendeeCount(concert.id)}
				{@const isJoined = joined.has(concert.id)}
				<div class="concert-row">
					<button class="concert-info" onclick={() => openChat(concert)}>
						<div class="concert-main">
							<span class="concert-artist">{concert.artist}</span>
							<span class="concert-meta">{concert.venue} · {concert.city}</span>
							<span class="concert-date">{formatDate(concert.date)}</span>
						</div>
						<div class="concert-right">
							<div class="attendees">
								<span class="attendee-count">{count}</span>
								<span class="attendee-label">going</span>
							</div>
							<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9 18l6-6-6-6"/>
							</svg>
						</div>
					</button>
					<div class="join-row">
						<div class="avatars">
							{#each (mockUsers[concert.id] ?? []).slice(0, 4) as name}
								<div class="mini-avatar" title={name}>{name[0]}</div>
							{/each}
							{#if isJoined}
								<div class="mini-avatar you" title="You">Y</div>
							{/if}
						</div>
						<button
							class="join-btn"
							class:joined={isJoined}
							onclick={() => toggleJoin(concert.id)}
						>
							{isJoined ? '✓ Going' : '+ Join'}
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

{:else}
	<!-- ── Chat view ── -->
	<header class="chat-header">
		<button class="back-btn" onclick={closeChat}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</button>
		<div class="chat-title">
			<span class="chat-artist">{selectedConcert?.artist}</span>
			<span class="chat-venue">{selectedConcert?.city} · {attendeeCount(selectedConcert?.id)} going</span>
		</div>
	</header>

	<div class="messages" bind:this={messagesEl}>
		{#each messages as msg (msg.id)}
			<div class="msg-wrap" class:mine={msg.mine}>
				{#if !msg.mine}
					<div class="msg-avatar">{msg.user[0]}</div>
				{/if}
				<div class="msg-block">
					{#if !msg.mine}
						<span class="msg-user">{msg.user}</span>
					{/if}
					<div class="bubble" class:mine={msg.mine}>{msg.text}</div>
					<span class="msg-time">{msg.timeStr}</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="input-bar">
		<input
			type="text"
			bind:value={chatInput}
			placeholder="Message…"
			class="chat-input"
			onkeydown={onKeydown}
		/>
		<button class="send-btn" onclick={sendMessage} disabled={!chatInput.trim()}>
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
			</svg>
		</button>
	</div>
{/if}

<style>
	/* ── List view ── */
	.header {
		padding: 14px 20px 10px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}
	.title { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
	.subtitle { font-size: 12px; color: #9ca3af; margin-top: 2px; }

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 12px 14px 16px;
	}

	.empty {
		text-align: center;
		color: #9ca3af;
		font-size: 14px;
		padding: 60px 20px;
		line-height: 1.5;
	}

	.concert-row {
		background: #fff;
		border-radius: 16px;
		margin-bottom: 12px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.08);
		overflow: hidden;
	}

	.concert-info {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 14px 10px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		gap: 10px;
	}

	.concert-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.concert-artist {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.concert-meta { font-size: 12px; color: #6b7280; }
	.concert-date { font-size: 11px; color: #9ca3af; }

	.concert-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.attendees {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.attendee-count { font-size: 18px; font-weight: 800; color: #2563eb; }
	.attendee-label { font-size: 10px; color: #9ca3af; font-weight: 600; }

	.chevron { width: 16px; height: 16px; color: #d1d5db; }

	.join-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 14px 12px;
		border-top: 1px solid #f3f4f6;
	}

	.avatars { display: flex; }
	.mini-avatar {
		width: 26px;
		height: 26px;
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
	}
	.mini-avatar:first-child { margin-left: 0; }
	.mini-avatar.you { background: #2563eb; color: #fff; }

	.join-btn {
		padding: 6px 16px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 700;
		border: 2px solid #2563eb;
		color: #2563eb;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.join-btn.joined { background: #2563eb; color: #fff; }

	/* ── Chat view ── */
	.chat-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.back-btn {
		background: #f3f4f6;
		border: none;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
	}
	.back-btn svg { width: 18px; height: 18px; }

	.chat-title { display: flex; flex-direction: column; min-width: 0; }
	.chat-artist { font-size: 15px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.chat-venue { font-size: 11px; color: #9ca3af; }

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 14px 14px 6px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.msg-wrap {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}
	.msg-wrap.mine { flex-direction: row-reverse; }

	.msg-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #dbeafe;
		color: #2563eb;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.msg-block {
		display: flex;
		flex-direction: column;
		max-width: 70%;
	}
	.msg-wrap.mine .msg-block { align-items: flex-end; }

	.msg-user { font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 3px; }

	.bubble {
		background: #f3f4f6;
		color: #111827;
		padding: 8px 12px;
		border-radius: 16px 16px 16px 4px;
		font-size: 14px;
		line-height: 1.4;
	}
	.bubble.mine {
		background: #2563eb;
		color: #fff;
		border-radius: 16px 16px 4px 16px;
	}

	.msg-time { font-size: 10px; color: #d1d5db; margin-top: 3px; }

	.input-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: #fff;
		border-top: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.chat-input {
		flex: 1;
		padding: 10px 14px;
		border: 1.5px solid #e5e7eb;
		border-radius: 22px;
		font-size: 14px;
		outline: none;
		font-family: inherit;
		color: #111827;
		background: #f9fafb;
		transition: border-color 0.15s;
	}
	.chat-input:focus { border-color: #2563eb; background: #fff; }

	.send-btn {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: #2563eb;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #fff;
		transition: opacity 0.15s;
	}
	.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.send-btn svg { width: 18px; height: 18px; }
</style>
