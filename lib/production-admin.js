import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {neon} from '@neondatabase/serverless';

const deriveKey = promisify(crypto.scrypt);
const maxAge = 8 * 60 * 60;
const cookieName = '__Host-liang_admin';
export function adminConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.ADMIN_EMAIL &&
    /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(process.env.ADMIN_PASSWORD_HASH || ''));
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function sessionCookie(value, age) {
  return `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
export async function productionSignedIn(req) {
  const token = req.cookies[cookieName];
  if (!adminConfigured() || !/^[a-f0-9]{64}$/.test(token || '')) return false;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT 1 FROM admin_sessions WHERE token_hash = ${hash(token)} AND expires_at > now()`;
  return rows.length === 1;
}
export async function productionAuth(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.origin !== `https://${req.headers.host}`) return res.status(403).end();
  if (!adminConfigured()) return res.status(503).end();
  const {action, email, password} = req.body || {};
  const sql = neon(process.env.DATABASE_URL);
  if (action === 'login') {
    if (typeof email !== 'string' || email.length > 254 ||
        typeof password !== 'string' || password.length < 12 || password.length > 256) return res.status(403).end();
    const bucket = Math.floor(Date.now() / 600000);
    const attempts = await sql`INSERT INTO admin_login_attempts (bucket, attempts) VALUES (${bucket}, 1)
      ON CONFLICT (bucket) DO UPDATE SET attempts = admin_login_attempts.attempts + 1
      WHERE admin_login_attempts.attempts < 10 RETURNING attempts`;
    if (!attempts.length) return res.status(429).end();
    const [salt, digest] = process.env.ADMIN_PASSWORD_HASH.split(':');
    const derived = await deriveKey(password, Buffer.from(salt, 'hex'), 64);
    if (email.trim().toLowerCase() !== process.env.ADMIN_EMAIL.trim().toLowerCase() ||
        !crypto.timingSafeEqual(derived, Buffer.from(digest, 'hex'))) return res.status(403).end();
    const token = crypto.randomBytes(32).toString('hex');
    await sql.transaction([
      sql`DELETE FROM admin_sessions WHERE expires_at <= now()`,
      sql`DELETE FROM admin_login_attempts WHERE bucket < ${bucket}`,
      sql`INSERT INTO admin_sessions VALUES (${hash(token)}, ${new Date(Date.now() + maxAge * 1000).toISOString()})`
    ]);
    res.setHeader('Set-Cookie', sessionCookie(token, maxAge));
    return res.json({ok:true});
  }
  if (action === 'logout') {
    const token = req.cookies[cookieName];
    if (/^[a-f0-9]{64}$/.test(token || '')) await sql`DELETE FROM admin_sessions WHERE token_hash = ${hash(token)}`;
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.json({ok:true});
  }
  return res.status(403).end();
}
