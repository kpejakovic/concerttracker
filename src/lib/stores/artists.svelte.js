import { browser } from '$app/environment';

function getUserEmail() {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem('ct-session');
		if (!raw) return null;
		return JSON.parse(raw).email ?? null;
	} catch {
		return null;
	}
}

function apiHeaders() {
	const email = getUserEmail();
	return {
		'Content-Type': 'application/json',
		...(email ? { 'X-User-Email': email } : {})
	};
}

function getStorageKey() {
	if (!browser) return null;
	const email = getUserEmail();
	return email ? `artists-${email}` : null;
}

function loadFromStorage() {
	if (!browser) return [];
	const key = getStorageKey();
	if (!key) return [];
	try {
		return JSON.parse(localStorage.getItem(key) || '[]');
	} catch {
		return [];
	}
}

function createStore() {
	let items = $state(loadFromStorage());

	function persist() {
		if (!browser) return;
		const key = getStorageKey();
		if (key) localStorage.setItem(key, JSON.stringify(items));
	}

	return {
		get items() {
			return items;
		},

		reload() {
			items = loadFromStorage();
		},

		async syncWithServer() {
			if (!browser) return;
			try {
				const res = await fetch('/api/artists', { headers: apiHeaders() });
				if (!res.ok) return;
				const serverData = await res.json();
				if (!Array.isArray(serverData)) return;
				items = serverData;
				persist();
			} catch {}
		},

		add(artist) {
			const item = { ...artist, id: artist.id ?? Date.now() };
			items = [...items, item];
			persist();
			if (browser) {
				fetch('/api/artists', {
					method: 'POST',
					headers: apiHeaders(),
					body: JSON.stringify(item)
				}).catch(() => {});
			}
		},

		update(id, fields) {
			items = items.map((a) => (a.id === id ? { ...a, ...fields } : a));
			persist();
			if (browser) {
				fetch(`/api/artists/${id}`, {
					method: 'PATCH',
					headers: apiHeaders(),
					body: JSON.stringify(fields)
				}).catch(() => {});
			}
		},

		remove(id) {
			items = items.filter((a) => a.id !== id);
			persist();
			if (browser) {
				fetch(`/api/artists/${id}`, {
					method: 'DELETE',
					headers: apiHeaders()
				}).catch(() => {});
			}
		}
	};
}

export const artistStore = createStore();
