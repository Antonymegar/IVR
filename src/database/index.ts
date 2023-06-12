import { MongoClient } from "mongodb";


const uri = process.env.MONGO_URI || "mongodb://localhost:27017/voicex";

const client = new MongoClient(uri);

const database = client.db("voicex");


export { client, database }