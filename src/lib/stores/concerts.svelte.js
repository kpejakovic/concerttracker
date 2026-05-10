import { browser } from '$app/environment';
import { concertsData } from '$lib/data/concerts.js';

const STORAGE_KEY = 'concert-tracker-v1';

function loadInitial() {
	if (!browser) return concertsData;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return concertsData;

	const storedItems = JSON.parse(stored);
	const storedIds = new Set(storedItems.map((c) => c.id));

	// Merge: keep all stored concerts + add any new defaults not yet in storage
	const newDefaults = concertsData.filter((c) => !storedIds.has(c.id));
	return [...storedItems, ...newDefaults];
}

function createStore() {
	let items = $state(loadInitial());

	function persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}

	return {
		get items() {
			return items;
		},
		add(concert) {
			items = [...items, { ...concert, id: concert.id ?? Date.now() }];
			persist();
		},
		remove(id) {
			items = items.filter((c) => c.id !== id);
			persist();
		},
		rate(id, rating, notes) {
			items = items.map((c) =>
				c.id === id ? { ...c, rating, ...(notes !== undefined ? { notes } : {}) } : c
			);
			persist();
		}
	};
}

export const concertStore = createStore();
