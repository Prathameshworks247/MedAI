import { MongoClient } from "mongodb";

import { MONGODB_URI } from "../config.js";

const connectionString = MONGODB_URI;
const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}
let db = conn?.db("sample_training");

export default db;