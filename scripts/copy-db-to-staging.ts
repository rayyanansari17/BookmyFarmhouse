/**
 * Copies production data into the staging database so staging has realistic content.
 *
 * Usage:
 *   SOURCE_MONGODB_URI="mongodb+srv://.../bookmyfarmhouse" \
 *   TARGET_MONGODB_URI="mongodb+srv://.../bookmyfarmhouse_staging" \
 *   npx tsx scripts/copy-db-to-staging.ts            # copy
 *   npx tsx scripts/copy-db-to-staging.ts --verify   # only print document counts for both DBs
 *
 * Safety: refuses to run unless the target database name contains "staging" and differs from
 * the source. Copied collections are replaced in the target; the source is only read.
 */
import { MongoClient, type Db } from "mongodb";

// Content needed to exercise the site. Inquiries, logs, tokens, scrape jobs and SEO metrics
// are deliberately left out (customer PII / production-only history).
const COLLECTIONS = ["properties", "locations", "blogs", "users"];
const BATCH_SIZE = 500;

function dbName(uri: string): string {
  const name = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).pathname.replace(/^\//, "");
  if (!name) throw new Error(`No database name in URI path: ${uri.replace(/\/\/[^@]*@/, "//***@")}`);
  return name;
}

async function counts(db: Db): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const { name } of await db.listCollections().toArray()) {
    result[name] = await db.collection(name).countDocuments();
  }
  return result;
}

async function copyCollection(source: Db, target: Db, name: string): Promise<number> {
  const src = source.collection(name);
  const dst = target.collection(name);

  await dst.deleteMany({});

  let copied = 0;
  let batch: Record<string, unknown>[] = [];
  for await (const doc of src.find({})) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await dst.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await dst.insertMany(batch, { ordered: false });
    copied += batch.length;
  }

  // Recreate indexes (unique slugs/emails, the $text index used by search, ...)
  for (const index of await src.listIndexes().toArray()) {
    if (index.name === "_id_") continue;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- v/ns are server-generated, not createIndex options
    const { key, name: indexName, v: _v, ns: _ns, ...options } = index;
    await dst.createIndex(key, { ...options, name: indexName });
  }

  return copied;
}

async function main() {
  const sourceUri = process.env.SOURCE_MONGODB_URI;
  const targetUri = process.env.TARGET_MONGODB_URI;
  if (!sourceUri || !targetUri) {
    console.error("SOURCE_MONGODB_URI and TARGET_MONGODB_URI must both be set");
    process.exit(1);
  }

  const sourceDb = dbName(sourceUri);
  const targetDb = dbName(targetUri);
  if (!targetDb.includes("staging")) {
    console.error(`Refusing to write to "${targetDb}": target database name must contain "staging"`);
    process.exit(1);
  }
  if (sourceUri === targetUri || sourceDb === targetDb) {
    console.error("Source and target are the same database");
    process.exit(1);
  }

  const sourceClient = await MongoClient.connect(sourceUri);
  const targetClient = await MongoClient.connect(targetUri);
  try {
    const source = sourceClient.db(sourceDb);
    const target = targetClient.db(targetDb);

    if (!process.argv.includes("--verify")) {
      for (const name of COLLECTIONS) {
        const copied = await copyCollection(source, target, name);
        console.log(`copied ${name}: ${copied}`);
      }
    }

    const [sourceCounts, targetCounts] = await Promise.all([counts(source), counts(target)]);
    const names = [...new Set([...Object.keys(sourceCounts), ...Object.keys(targetCounts)])].sort();
    console.log(`\n${"collection".padEnd(24)} ${sourceDb.padStart(22)} ${targetDb.padStart(26)}`);
    for (const name of names) {
      console.log(
        `${name.padEnd(24)} ${String(sourceCounts[name] ?? "-").padStart(22)} ${String(targetCounts[name] ?? "-").padStart(26)}`
      );
    }
  } finally {
    await Promise.all([sourceClient.close(), targetClient.close()]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
