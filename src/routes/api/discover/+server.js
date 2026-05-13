import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db.js';

export async function GET() {
	const db = await connectDB();
	const concerts = await db.collection('discover').find({}, { projection: { _id: 0 } }).toArray();
	return json(concerts);
}
