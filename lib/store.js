import fs from 'node:fs';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

export function db() {
  fs.mkdirSync('.local',{recursive:true});
  const db=new DatabaseSync('.local/site.sqlite');
  db.exec(`CREATE TABLE IF NOT EXISTS owner(id INTEGER PRIMARY KEY CHECK(id=1),email TEXT, salt TEXT, hash TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER);
    CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY,data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS init(id INTEGER PRIMARY KEY);`);
  if (!db.prepare('SELECT id FROM init').get()) {
    db.exec('BEGIN');
    for(const item of JSON.parse(fs.readFileSync('content/cases.json','utf8'))) db.prepare('INSERT INTO cases VALUES(?,?)').run(item.id,JSON.stringify(item));
    db.exec('INSERT INTO init VALUES(1); COMMIT');
  }
  return db;
}
export function signedIn(db,req) {
  const token=req.cookies.liang_session;
  return token && db.prepare('SELECT 1 FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());
}
export function digest(value){return crypto.createHash('sha256').update(value).digest('hex');}
export function cases(db){return db.prepare('SELECT data FROM cases ORDER BY rowid').all().map(row=>JSON.parse(row.data));}
export function setupToken(){
  try {fs.writeFileSync('.local/invite',crypto.randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});} catch(error){if(error.code!=='EEXIST')throw error}
  return fs.readFileSync('.local/invite','utf8').trim();
}
