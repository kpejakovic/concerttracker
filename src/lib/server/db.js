import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/dynamic/private';

let client = null;
let db = null;

export async function connectDB() {
	if (!db) {
		client = new MongoClient(MONGODB_URI);
		await client.connect();
		db = client.db();
	}
	return db;
}
