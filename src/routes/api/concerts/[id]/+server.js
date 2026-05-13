import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db.js';

export async function PATCH({ params, request }) {
	const db = await connectDB();
	const id = Number(params.id);
	const updates = await request.json();
	await db.collection('concerts').updateOne({ id }, { $set: updates });
	return json({ success: true });
}

export async function DELETE({ params }) {
	const db = await connectDB();
	const id = Number(params.id);
	await db.collection('concerts').deleteOne({ id });
	return json({ success: true });
}
