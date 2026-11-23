import {neon} from '@neondatabase/serverless';
import {db, cases} from './store';

export async function readGallery() {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT data FROM gallery_cases ORDER BY display_order`;
    return rows.map(({data}) => data);
  }
  if (process.env.NETLIFY === 'true') {
    throw new Error('DATABASE_URL is required for the Netlify gallery.');
  }
  const connection = db();
  try {
    return cases(connection);
  } finally {
    connection.close();
  }
}
