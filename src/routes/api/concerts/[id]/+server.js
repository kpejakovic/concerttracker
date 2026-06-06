import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function PATCH({ params, request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json({ error: 'No user' }, { status: 400 });

	const id = Number(params.id);
	const updates = await request.json();
	await db.collection('concerts').updateOne({ id, userEmail: email }, { $set: updates });
	return json({ success: true });
}

export async function DELETE({ params, request }) {
	const email = request.headers.get('x-user-email');
	if (!email) return json({ error: 'No user' }, { status: 400 });

	const id = Number(params.id);
	await db.collection('concerts').deleteOne({ id, userEmail: email });
	return json({ success: true });
}
