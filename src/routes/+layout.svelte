<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let time = $state(
		new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
	);

	$effect(() => {
		const id = setInterval(() => {
			time = new Date().toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		}, 10000);
		return () => clearInterval(id);
	});

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/map', label: 'Map' },
		{ href: '/connect', label: 'Connect' },
		{ href: '/profile', label: 'Profile' }
	];

	let activePath = $derived(page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<div class="phone">
		<!-- Status Bar -->
		<div class="status-bar">
			<span class="time">{time}</span>
			<div class="dynamic-island"></div>
			<div class="status-icons">
				<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
					<rect x="0" y="8" width="3" height="4" rx="1" opacity="0.3" />
					<rect x="4.5" y="5.5" width="3" height="6.5" rx="1" opacity="0.5" />
					<rect x="9" y="3" width="3" height="9" rx="1" opacity="0.75" />
					<rect x="13.5" y="0" width="3" height="12" rx="1" />
				</svg>
				<svg width="16" height="12" viewBox="0 0 16 12" fill="none">
					<path d="M8 10a1.5 1.5 0 1 1 0 2A1.5 1.5 0 0 1 8 10z" fill="currentColor" />
					<path d="M4 7.2C5.1 6 6.5 5.3 8 5.3s2.9.7 4 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
					<path d="M1 4.4C3 2.3 5.4 1 8 1s5 1.3 7 3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.4" />
				</svg>
				<svg width="27" height="13" viewBox="0 0 27 13">
					<rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3" stroke="currentColor" stroke-width="1.2" fill="none" />
					<rect x="2" y="2" width="16" height="9" rx="1.5" fill="currentColor" />
					<path d="M25 4.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</div>
		</div>

		<!-- Page content -->
		<div class="content">
			{@render children()}
		</div>

		<!-- Bottom Nav -->
		<nav class="bottom-nav">
			{#each navItems as item}
				<a href={item.href} class="nav-item" class:active={activePath === item.href}>
					{#if item.label === 'Home'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 12l9-9 9 9" /><path d="M9 21V12h6v9" /><path d="M5 10v11h14V10" />
						</svg>
					{:else if item.label === 'Map'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
						</svg>
					{:else if item.label === 'Connect'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
						</svg>
					{/if}
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Home Indicator -->
		<div class="home-indicator"></div>
	</div>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		-webkit-font-smoothing: antialiased;
		background: #d0d8e8;
	}

	.shell {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100dvh;
		padding: 32px 16px;
		background: linear-gradient(145deg, #c9d4e8 0%, #dde3ef 100%);
	}

	.phone {
		width: 393px;
		height: 852px;
		background: #f2f4f7;
		border-radius: 52px;
		border: 11px solid #1c1c1e;
		box-shadow:
			0 0 0 1px #3a3a3c,
			0 40px 100px rgba(0, 0, 0, 0.35),
			0 10px 30px rgba(0, 0, 0, 0.2),
			inset 0 0 0 1px rgba(255, 255, 255, 0.08);
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	/* Status bar */
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 24px 0;
		flex-shrink: 0;
		height: 50px;
		color: #111827;
		position: relative;
		z-index: 10;
	}

	.time {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.3px;
		min-width: 48px;
	}

	.dynamic-island {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 126px;
		height: 34px;
		background: #1c1c1e;
		border-radius: 20px;
	}

	.status-icons {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #111827;
	}

	/* Content area */
	.content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Bottom nav */
	.bottom-nav {
		display: flex;
		background: #ffffff;
		border-top: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 10px 0;
		text-decoration: none;
		color: #9ca3af;
		transition: color 0.15s;
	}

	.nav-item.active {
		color: #2563eb;
	}

	.nav-item svg {
		width: 22px;
		height: 22px;
	}

	.nav-item span {
		font-size: 10px;
		font-weight: 600;
	}

	/* Home indicator */
	.home-indicator {
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		flex-shrink: 0;
	}

	.home-indicator::after {
		content: '';
		width: 130px;
		height: 5px;
		background: #1c1c1e;
		border-radius: 3px;
		opacity: 0.18;
	}

	/* On real mobile: go full screen */
	@media (max-width: 500px) {
		:global(body) { background: #f2f4f7; }
		.shell { padding: 0; align-items: flex-start; background: #f2f4f7; }
		.phone { width: 100%; height: 100dvh; border: none; border-radius: 0; box-shadow: none; }
		.status-bar { display: none; }
		.home-indicator { display: none; }
	}
</style>
