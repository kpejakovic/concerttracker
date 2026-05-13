<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Explore' },
		{ href: '/map', label: 'My Concerts' },
		{ href: '/connect', label: 'Connect' },
		{ href: '/profile', label: 'Profile' }
	];

	let activePath = $derived(page.url.pathname);

	function isActive(href) {
		if (href === '/') return activePath === '/';
		return activePath.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
	<div class="container-xl">
		<a class="navbar-brand fw-bold" href="/">🎵 ConcertTracker</a>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarMain"
			aria-controls="navbarMain"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarMain">
			<ul class="navbar-nav ms-auto mb-2 mb-lg-0">
				{#each navItems as item}
					<li class="nav-item">
						<a class="nav-link" class:active={isActive(item.href)} href={item.href}>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</nav>

{@render children()}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		-webkit-font-smoothing: antialiased;
		background: #f8f9fa;
		min-height: 100vh;
	}
</style>
