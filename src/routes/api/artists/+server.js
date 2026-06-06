import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function GET({ request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json([]);

	const artists = await db
		.collection('artists')
		.find({ userEmail: email }, { projection: { _id: 0, userEmail: 0 } })
		.toArray();
	return json(artists);
}

export async function POST({ request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json({ error: 'No user' }, { status: 400 });

	const artist = await request.json();
	if (!artist.id) artist.id = Date.now();
	await db.collection('artists').insertOne({ ...artist, userEmail: email });
	return json(artist, { status: 201 });
}
