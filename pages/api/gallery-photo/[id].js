import {neon} from '@neondatabase/serverless';

export default async function photo(req,res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  const {id} = req.query;
  if (!process.env.DATABASE_URL || typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return res.status(404).end();
  const sql = neon(process.env.DATABASE_URL);
  const [row] = await sql`SELECT payload FROM gallery_photos WHERE id::text=${id}`;
  if (!row) return res.status(404).end();
  res.setHeader('Content-Type','image/webp');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','public, max-age=300');
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(row.payload,'base64'));
}
