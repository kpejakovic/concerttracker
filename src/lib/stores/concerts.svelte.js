import { browser } from '$app/environment';
import { concertsData } from '$lib/data/concerts.js';

const STORAGE_KEY = 'concert-tracker-v1';

function loadFromStorage() {
	if (!browser) return concertsData;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return concertsData;
	try {
		const storedItems = JSON.parse(stored);
		const storedIds = new Set(storedItems.map((c) => c.id));
		const newDefaults = concertsData.filter((c) => !storedIds.has(c.id));
		return [...storedItems, ...newDefaults];
	} catch {
		return concertsData;
	}
}

function createStore() {
	let items = $state(loadFromStorage());

	// On browser load, sync with MongoDB and replace local state
	if (browser) {
		fetch('/api/concerts')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data && data.length > 0) {
					items = data;
					localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
				}
			})
			.catch(() => {});
	}

	function persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}

	return {
		get items() {
			return items;
		},

		add(concert) {
			const item = { ...concert, id: concert.id ?? Date.now() };
			items = [...items, item];
			persist();
			if (browser) {
				fetch('/api/concerts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item)
				}).catch(() => {});
			}
		},

		remove(id) {
			items = items.filter((c) => c.id !== id);
			persist();
			if (browser) {
				fetch(`/api/concerts/${id}`, { method: 'DELETE' }).catch(() => {});
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
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ rating, ...(notes !== undefined ? { notes } : {}) })
				}).catch(() => {});
			}
		}
	};
}

export const concertStore = createStore();
