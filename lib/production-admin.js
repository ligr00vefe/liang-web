import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {neon} from '@neondatabase/serverless';

const deriveKey = promisify(crypto.scrypt);
const maxAge = 8 * 60 * 60;
const cookieName = '__Host-liang_admin';
export async function adminState() {
  if (!process.env.DATABASE_URL) return {ready:false, invite:false};
  const sql = neon(process.env.DATABASE_URL);
  const [owner] = await sql`SELECT password_hash IS NOT NULL AS ready, (invite_expires_at > now()) IS TRUE AS invite FROM admin_owner WHERE id=1`;
  return owner || {ready:false, invite:false};
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function sessionCookie(value, age) {
  return `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
export async function productionSignedIn(req) {
  const token = req.cookies[cookieName];
  if (!process.env.DATABASE_URL || !/^[a-f0-9]{64}$/.test(token || '')) return false;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT 1 FROM admin_sessions WHERE token_hash = ${hash(token)} AND expires_at > now()`;
  return rows.length === 1;
}
export async function productionAuth(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.origin !== `https://${req.headers.host}`) return res.status(403).end();
  if (!process.env.DATABASE_URL) return res.status(503).end();
  const {action, email, password, token: invite, item, id} = req.body || {};
  const sql = neon(process.env.DATABASE_URL);
  if (action === 'setup') {
    if (typeof email !== 'string' || email.length > 254 ||
        typeof password !== 'string' || password.length < 12 || password.length > 256 ||
        typeof invite !== 'string' || !/^[a-f0-9]{64}$/.test(invite)) return res.status(403).end();
    const salt = crypto.randomBytes(16);
    const key = await deriveKey(password, salt, 64);
    const secret = salt.toString('hex') + ':' + key.toString('hex');
    const rows = await sql`UPDATE admin_owner SET password_hash=${secret}, invite_hash=NULL, invite_expires_at=NULL
      WHERE id=1 AND email=${email.trim().toLowerCase()} AND password_hash IS NULL
      AND invite_hash=${hash(invite)} AND invite_expires_at > now() RETURNING id`;
    return rows.length ? res.json({ok:true}) : res.status(403).end();
  }
  if (action === 'login') {
    if (typeof email !== 'string' || email.length > 254 ||
        typeof password !== 'string' || password.length < 1 || password.length > 256) return res.status(403).end();
    const bucket = Math.floor(Date.now() / 600000);
    const attempts = await sql`INSERT INTO admin_login_attempts (bucket, attempts) VALUES (${bucket}, 1)
      ON CONFLICT (bucket) DO UPDATE SET attempts = admin_login_attempts.attempts + 1
      WHERE admin_login_attempts.attempts < 10 RETURNING attempts`;
    if (!attempts.length) return res.status(429).end();
    const [owner] = await sql`SELECT email, password_hash FROM admin_owner WHERE id=1`;
    if (!owner?.password_hash) return res.status(503).end();
    const [salt, digest] = owner.password_hash.split(':');
    const derived = await deriveKey(password, Buffer.from(salt, 'hex'), 64);
    if (email.trim().toLowerCase() !== owner.email ||
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
  if (!await productionSignedIn(req)) return res.status(401).end();
  if (action === 'delete') {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(id)) return res.status(400).end();
    await sql`DELETE FROM gallery_cases WHERE id=${id}`;
    return res.json({ok:true});
  }
  if (action === 'save') return saveCase(sql, res, id, item);
  return res.status(400).end();
}

async function saveCase(sql, res, id, item) {
  const fields = {short:100, products:250, desc:3000, material:250, finish:250, condition:500};
  if (!item || typeof item !== 'object' || !['카페','매장','사무실'].includes(item.category) ||
      (id !== '' && (typeof id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(id))) ||
      !Array.isArray(item.photos) || item.photos.length < 1 || item.photos.length > 10) return res.status(400).end();
  const data = {id:id || crypto.randomUUID(), category:item.category, ai:item.ai === true, photos:[]};
  for (const [name, max] of Object.entries(fields)) {
    const value = item[name] ?? '';
    if (typeof value !== 'string' || value.length > max ||
        (['short','products','desc'].includes(name) && !value.trim())) return res.status(400).end();
    data[name] = value.trim();
  }
  const prior = id ? (await sql`SELECT data FROM gallery_cases WHERE id=${id}`)[0] : null;
  if (id && !prior) return res.status(404).end();
  const uploads = [];
  for (const photo of item.photos) {
    if (typeof photo !== 'string') return res.status(400).end();
    if (prior?.data.photos.includes(photo)) { data.photos.push(photo); continue; }
    if (photo.length > 360000 || !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)) return res.status(400).end();
    const payload = photo.split(',')[1];
    const image = Buffer.from(payload, 'base64');
    if (image.toString('ascii',0,4) !== 'RIFF' || image.toString('ascii',8,12) !== 'WEBP') return res.status(400).end();
    const photoId=crypto.randomUUID();
    uploads.push({photoId,payload});
    data.photos.push('/api/gallery-photo/' + photoId);
  }
  const keep = data.photos.filter(p=>p.startsWith('/api/gallery-photo/')).map(p=>p.split('/').pop());
  await sql.transaction([
    id ? sql`UPDATE gallery_cases SET data=${JSON.stringify(data)}::jsonb WHERE id=${id}`
       : sql`INSERT INTO gallery_cases(id,data) VALUES (${data.id},${JSON.stringify(data)}::jsonb)`,
    sql`DELETE FROM gallery_photos WHERE case_id=${data.id} AND NOT (id::text = ANY(${keep}::text[]))`,
    ...uploads.map(({photoId,payload})=>sql`INSERT INTO gallery_photos VALUES (${photoId},${data.id},${payload})`)
  ]);
  return res.json({ok:true});
}