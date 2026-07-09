const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Neon successfully!");
    await client.end();
  } catch (e) {
    console.error(e);
  }
})();