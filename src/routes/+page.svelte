<script>
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import ConcertCard from '$lib/components/ConcertCard.svelte';
	import AddConcertModal from '$lib/components/AddConcertModal.svelte';

	let showModal = $state(false);
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
</script>

<!-- Header -->
<header class="header">
	<div class="header-inner">
		<span class="logo-icon">🎵</span>
		<h1 class="app-title">Concert Tracker</h1>
	</div>
	<p class="header-stats">{upcomingConcerts.length} upcoming · {pastConcerts.length} attended</p>
</header>

<!-- Tab Bar -->
<nav class="tabs">
	<button class="tab" class:active={activeTab === 'upcoming'} onclick={() => (activeTab = 'upcoming')}>
		Upcoming <span class="tab-count">{upcomingConcerts.length}</span>
	</button>
	<button class="tab" class:active={activeTab === 'past'} onclick={() => (activeTab = 'past')}>
		Past <span class="tab-count">{pastConcerts.length}</span>
	</button>
</nav>

<!-- List -->
<main class="list">
	{#if displayed.length === 0}
		<div class="empty">No concerts here yet. Tap + to add one.</div>
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

<!-- FAB -->
<button class="fab" onclick={() => (showModal = true)} aria-label="Add concert">+</button>

<!-- Modal -->
<AddConcertModal
	open={showModal}
	onclose={() => (showModal = false)}
	onadd={(concert) => concertStore.add(concert)}
/>

<style>
	.header {
		padding: 12px 20px 14px;
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.header-inner {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
	}

	.logo-icon { font-size: 22px; }

	.app-title {
		font-size: 22px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
	}

	.header-stats {
		font-size: 12px;
		color: #9ca3af;
		padding-left: 30px;
	}

	.tabs {
		display: flex;
		padding: 0 20px;
		background: #ffffff;
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

	.tab.active {
		color: #111827;
		border-bottom-color: #2563eb;
	}

	.tab-count {
		font-size: 11px;
		font-weight: 700;
		background: #f3f4f6;
		color: #9ca3af;
		padding: 1px 7px;
		border-radius: 20px;
	}

	.tab.active .tab-count {
		background: #dbeafe;
		color: #2563eb;
	}

	.list {
		flex: 1;
		padding: 14px 14px 80px;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		position: relative;
	}

	.empty {
		text-align: center;
		color: #9ca3af;
		font-size: 14px;
		padding: 60px 20px;
		line-height: 1.5;
	}

	.fab {
		position: absolute;
		bottom: 20px;
		right: 18px;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #2563eb;
		color: white;
		font-size: 26px;
		font-weight: 300;
		border: none;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s;
		z-index: 10;
	}

	.fab:active { transform: scale(0.93); }
</style>
