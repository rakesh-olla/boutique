import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

// tsx does not load .env automatically — match Next.js precedence (.env.local wins).
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB ?? "boutique";
  const email = (process.env.ADMIN_EMAIL ?? "admin@localhost").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const secretHint = process.env.AUTH_SECRET;

  if (!uri) {
    console.error(`
MONGODB_URI is missing.

1. Copy ".env.example" to ".env" in this folder:
   ${process.cwd()}
2. Paste your MongoDB Atlas connection string as MONGODB_URI=...
3. Set AUTH_SECRET to a random string (at least 16 characters).
4. Optional: ADMIN_EMAIL and ADMIN_PASSWORD (defaults: admin@localhost / admin123)
5. Run again: npm run seed

Login must use the same email/password you set (or the defaults above).
`);
    process.exit(1);
  }
  if (!secretHint || secretHint.length < 16) {
    console.warn(
      "Warning: AUTH_SECRET should be set (min 16 chars) in .env before running the app.",
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const hash = await bcrypt.hash(password, 12);
  await db.collection("users").updateOne(
    { email },
    {
      $set: {
        email,
        passwordHash: hash,
        role: "admin",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log(`Admin user ready. Sign in with:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: (the value of ADMIN_PASSWORD in .env, or default admin123)`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
