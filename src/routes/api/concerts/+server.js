import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function GET({ request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json([]);

	const concerts = await db
		.collection('concerts')
		.find({ userEmail: email }, { projection: { _id: 0, userEmail: 0 } })
		.toArray();
	return json(concerts);
}

export async function POST({ request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json({ error: 'No user' }, { status: 400 });

	const concert = await request.json();
	if (!concert.id) concert.id = Date.now();
	await db.collection('concerts').insertOne({ ...concert, userEmail: email });
	return json(concert, { status: 201 });
}
