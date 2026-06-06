function createAuthStore() {
	let user = $state(null);
	let initialized = $state(false);

	function init() {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem('ct-session');
		if (raw) {
			try {
				const s = JSON.parse(raw);
				if (s.expiresAt > Date.now()) {
					user = { email: s.email, name: s.name };
				} else {
					localStorage.removeItem('ct-session');
				}
			} catch {
				localStorage.removeItem('ct-session');
			}
		}
		initialized = true;
	}

	function login(email, password) {
		const users = JSON.parse(localStorage.getItem('ct-users') || '[]');
		const found = users.find(
			(u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
		);
		if (!found) return { error: 'Invalid email or password.' };
		_setSession(found.email, found.name, false);
		return { success: true };
	}

	function register(email, name, password) {
		const users = JSON.parse(localStorage.getItem('ct-users') || '[]');
		if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
			return { error: 'This email is already registered.' };
		}
		users.push({ email: email.toLowerCase(), name, password });
		localStorage.setItem('ct-users', JSON.stringify(users));
		_setSession(email.toLowerCase(), name, true);
		return { success: true };
	}

	function logout() {
		localStorage.removeItem('ct-session');
		user = null;
	}

	function _setSession(email, name, isNew = false) {
		const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
		localStorage.setItem('ct-session', JSON.stringify({ email, name, expiresAt }));
		user = { email, name };
		// Pre-fill profile name on first registration
		if (isNew) {
			const key = `profile-${email}-name`;
			if (!localStorage.getItem(key)) {
				localStorage.setItem(key, JSON.stringify(name));
			}
		}
	}

	return {
		get user() {
			return user;
		},
		get initialized() {
			return initialized;
		},
		get isLoggedIn() {
			return user !== null;
		},
		init,
		login,
		register,
		logout
	};
}

export const authStore = createAuthStore();
