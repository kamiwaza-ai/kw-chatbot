// lib/db/index.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Prevent multiple connections in development due to hot reloading
declare global {
  // eslint-disable-next-line no-var
  var cachedClient: postgres.Sql | undefined;
}

let client: postgres.Sql;

if (process.env.NODE_ENV === 'production') {
  client = postgres(process.env.POSTGRES_URL!, {
    max: 10,
    connect_timeout: 5,
  });
} else {
  if (!global.cachedClient) {
    global.cachedClient = postgres(process.env.POSTGRES_URL!, {
      max: 10,
      connect_timeout: 5,
    });
  }
  client = global.cachedClient;
}

export const db = drizzle(client); 