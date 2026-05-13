import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

const client = new MongoClient(MONGODB_URI);
let db = null;

export async function connectDB() {
	if (!db) {
		await client.connect();
		db = client.db();
	}
	return db;
}
