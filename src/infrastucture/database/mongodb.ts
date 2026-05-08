import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Define MONGODB_URI");
}

client = new MongoClient(uri);
clientPromise = client.connect();

export default clientPromise;