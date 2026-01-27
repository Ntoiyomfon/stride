import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function run() {
    if (!uri) {
        console.error('MONGODB_URI is not defined');
        process.exit(1);
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
