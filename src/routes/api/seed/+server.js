import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db.js';
import { concertsData } from '$lib/data/concerts.js';
import { discoverData } from '$lib/data/discover.js';

export async function POST() {
	const db = await connectDB();

	const existingConcerts = await db.collection('concerts').countDocuments();
	const existingDiscover = await db.collection('discover').countDocuments();

	if (existingConcerts > 0 || existingDiscover > 0) {
		return json(
			{ message: 'Database already seeded. Use force=true to re-seed.' },
			{ status: 409 }
		);
	}

	await db.collection('concerts').insertMany(concertsData.map(({ ...c }) => c));
	await db.collection('discover').insertMany(discoverData.map(({ ...c }) => c));

	return json({
		success: true,
		concerts: concertsData.length,
		discover: discoverData.length
	});
}
