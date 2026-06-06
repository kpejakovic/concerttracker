<script>
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { concertStore } from '$lib/stores/concerts.svelte.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let mode = $state('login');
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	onMount(() => {
		if (authStore.isLoggedIn) goto('/');
	});

	function handleSubmit() {
		error = '';
		if (!email.trim() || !password.trim()) {
			error = 'Please fill in all fields.';
			return;
		}
		if (mode === 'register' && !name.trim()) {
			error = 'Please enter your name.';
			return;
		}

		loading = true;
		const result =
			mode === 'login'
				? authStore.login(email, password)
				: authStore.register(email, name, password);
		loading = false;

		if (result.error) {
			error = result.error;
		} else {
			concertStore.reload();
			concertStore.syncWithServer();
			goto('/');
		}
	}
</script>

<div class="login-page">
	<div class="login-card">
		<div class="login-header">
			<div class="brand">🎵 Concerty</div>
			<h1 class="h4 fw-bold mb-1">
				{mode === 'login' ? 'Welcome back' : 'Create account'}
			</h1>
			<p class="text-muted small mb-0">
				{mode === 'login' ? 'Sign in to your concert tracker' : 'Start tracking your concerts'}
			</p>
		</div>

		<form class="login-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			{#if mode === 'register'}
				<div class="mb-3">
					<label class="form-label fw-semibold small" for="name">Your name</label>
					<input
						id="name"
						class="form-control"
						type="text"
						placeholder="e.g. Kristina"
						bind:value={name}
						autocomplete="name"
					/>
				</div>
			{/if}

			<div class="mb-3">
				<label class="form-label fw-semibold small" for="email">Email</label>
				<input
					id="email"
					class="form-control"
					type="email"
					placeholder="you@example.com"
					bind:value={email}
					autocomplete="email"
				/>
			</div>

			<div class="mb-3">
				<label class="form-label fw-semibold small" for="password">Password</label>
				<input
					id="password"
					class="form-control"
					type="password"
					placeholder="Enter your password"
					bind:value={password}
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
				/>
			</div>

			{#if error}
				<div class="alert alert-danger py-2 small mb-3">{error}</div>
			{/if}

			<button class="btn btn-primary w-100 fw-semibold py-2" type="submit" disabled={loading}>
				{mode === 'login' ? 'Sign in' : 'Create account'}
			</button>
		</form>

		<div class="login-footer">
			{#if mode === 'login'}
				Don't have an account?
				<button class="toggle-btn" onclick={() => { mode = 'register'; error = ''; }}>Sign up</button>
			{:else}
				Already have an account?
				<button class="toggle-btn" onclick={() => { mode = 'login'; error = ''; }}>Sign in</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
		padding: 24px 16px;
	}

	.login-card {
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 420px;
		overflow: hidden;
	}

	.login-header {
		background: #111827;
		color: #fff;
		padding: 32px 32px 28px;
	}

	.brand {
		font-size: 20px;
		font-weight: 700;
		margin-bottom: 20px;
	}

	.login-header h1 {
		color: #fff;
	}

	.login-header .text-muted {
		color: #9ca3af !important;
	}

	.login-form {
		padding: 28px 32px 8px;
	}

	.login-footer {
		padding: 16px 32px 28px;
		text-align: center;
		font-size: 14px;
		color: #6b7280;
	}

	.toggle-btn {
		background: none;
		border: none;
		color: #2563eb;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		font-size: 14px;
	}
	.toggle-btn:hover {
		text-decoration: underline;
	}
</style>
