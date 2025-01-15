import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load environment variables from multiple possible sources
config({ path: '.env.local' });
config({ path: '.env.docker' });
config({ path: '.env' });

const MAX_RETRIES = 20;
const RETRY_INTERVAL = 500; // milliseconds

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const connection = postgres(process.env.POSTGRES_URL, {
        max: 1,
        idle_timeout: 5,
        connect_timeout: 5
      });

      const db = drizzle(connection);

      console.log('⏳ Running migrations...');
      const start = Date.now();
      await migrate(db, { migrationsFolder: './lib/db/migrations' });
      const end = Date.now();
      console.log('✅ Migrations completed in', end - start, 'ms');

      await connection.end();
      process.exit(0);
      return;

    } catch (err) {
      lastError = err as Error;
      retries++;
      
      if (retries < MAX_RETRIES) {
        console.log(`Migration attempt ${retries}/${MAX_RETRIES} failed, retrying in ${RETRY_INTERVAL}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      }
    }
  }

  console.error('❌ Migration failed after', MAX_RETRIES, 'attempts');
  console.error('Last error:', lastError);
  process.exit(1);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});