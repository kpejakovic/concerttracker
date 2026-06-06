<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { artistStore } from '$lib/stores/artists.svelte.js';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'My Concerts' },
		{ href: '/artists', label: 'Artists' },
		{ href: '/explore', label: 'Explore' },
		{ href: '/connect', label: 'Connect' },
		{ href: '/profile', label: 'Profile' }
	];

	let activePath = $derived(page.url.pathname);

	function isActive(href) {
		if (href === '/') return activePath === '/';
		return activePath.startsWith(href);
	}

	onMount(() => {
		authStore.init();
		concertStore.reload();
		artistStore.reload();
	});

	// Sync once when auth confirmed
	let syncDone = false;
	$effect(() => {
		if (authStore.isLoggedIn && authStore.initialized && !syncDone) {
			syncDone = true;
			concertStore.syncWithServer();
			artistStore.syncWithServer();
		}
	});

	$effect(() => {
		if (authStore.initialized && !authStore.isLoggedIn && activePath !== '/login') {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !authStore.initialized || (!authStore.isLoggedIn && activePath !== '/login')}
	<!-- blank while checking auth / redirecting -->
{:else if !authStore.isLoggedIn}
	{@render children()}
{:else}
	<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
		<div class="container-xl">
			<a class="navbar-brand fw-bold" href="/">🎵 Concerty</a>
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
				<ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
					{#each navItems as item}
						<li class="nav-item">
							<a class="nav-link" class:active={isActive(item.href)} href={item.href}>
								{item.label}
							</a>
						</li>
					{/each}
					<li class="nav-item ms-lg-2 mt-2 mt-lg-0">
						<button
							class="btn btn-outline-light btn-sm"
							onclick={() => { authStore.logout(); concertStore.reload(); goto('/login'); }}
						>
							Sign out
						</button>
					</li>
				</ul>
			</div>
		</div>
	</nav>

	{@render children()}
{/if}

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
