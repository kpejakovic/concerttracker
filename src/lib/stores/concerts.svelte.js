import { browser } from '$app/environment';

function getStorageKey() {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem('ct-session');
		if (!raw) return null;
		const { email } = JSON.parse(raw);
		return email ? `concerts-${email}` : null;
	} catch {
		return null;
	}
}

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
				const local = loadFromStorage();
				const res = await fetch('/api/concerts', { headers: apiHeaders() });
				if (!res.ok) return;
				const serverData = await res.json();
				if (!Array.isArray(serverData)) return;

				const serverIds = new Set(serverData.map((c) => c.id));
				const unsynced = local.filter((c) => !serverIds.has(c.id));

				await Promise.all(
					unsynced.map((c) =>
						fetch('/api/concerts', {
							method: 'POST',
							headers: apiHeaders(),
							body: JSON.stringify(c)
						}).catch(() => {})
					)
				);

				const merged = [
					...serverData,
					...unsynced
				];

				if (merged.length > 0) {
					items = merged;
					persist();
				}
			} catch {}
		},

		add(concert) {
			const item = { ...concert, id: concert.id ?? Date.now() };
			items = [...items, item];
			persist();
			if (browser) {
				fetch('/api/concerts', {
					method: 'POST',
					headers: apiHeaders(),
					body: JSON.stringify(item)
				}).catch(() => {});
			}
		},

		remove(id) {
			items = items.filter((c) => c.id !== id);
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, {
					method: 'DELETE',
					headers: apiHeaders()
				}).catch(() => {});
			}
		},

		update(id, fields) {
			items = items.map((c) => (c.id === id ? { ...c, ...fields } : c));
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, {
					method: 'PATCH',
					headers: apiHeaders(),
					body: JSON.stringify(fields)
				}).catch(() => {});
			}
		},

		rate(id, rating, notes) {
			items = items.map((c) =>
				c.id === id ? { ...c, rating, ...(notes !== undefined ? { notes } : {}) } : c
			);
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, {
					method: 'PATCH',
					headers: apiHeaders(),
					body: JSON.stringify({ rating, ...(notes !== undefined ? { notes } : {}) })
				}).catch(() => {});
			}
		},

		updateSetlist(id, setlist) {
			items = items.map((c) => (c.id === id ? { ...c, setlist } : c));
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, {
					method: 'PATCH',
					headers: apiHeaders(),
					body: JSON.stringify({ setlist })
				}).catch(() => {});
			}
		},

		updatePhotos(id, photos) {
			items = items.map((c) => (c.id === id ? { ...c, photos } : c));
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, {
					method: 'PATCH',
					headers: apiHeaders(),
					body: JSON.stringify({ photos })
				}).catch(() => {});
			}
		}
	};
}

export const concertStore = createStore();
