import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export async function connectDB() {
	if (!db) {
		client = new MongoClient(process.env.DB_URI);
		await client.connect();
		db = client.db();
	}
	return db;
}
