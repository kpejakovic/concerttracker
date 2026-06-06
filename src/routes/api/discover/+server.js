import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function GET() {
	const concerts = await db.collection('discover').find({}, { projection: { _id: 0 } }).toArray();
	return json(concerts);
}
