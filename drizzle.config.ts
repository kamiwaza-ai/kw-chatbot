// drizzle.config.ts

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.docker' });
dotenv.config({ path: '.env' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',  // or 'postgresql'
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});