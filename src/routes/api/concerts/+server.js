import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db.js';

export async function GET() {
	const db = await connectDB();
	const concerts = await db.collection('concerts').find({}, { projection: { _id: 0 } }).toArray();
	return json(concerts);
}

export async function POST({ request }) {
	const db = await connectDB();
	const concert = await request.json();
	if (!concert.id) concert.id = Date.now();
	await db.collection('concerts').insertOne({ ...concert, _id: undefined });
	return json(concert, { status: 201 });
}
