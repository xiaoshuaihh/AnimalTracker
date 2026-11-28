import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cleanJpeg } from '../server/index.js';

const scrypt = promisify(scryptCallback);

const cookieName = 'wildlife_session';
const sessionDays = 30;
const usernamePattern = /^[a-z0-9_-]{3,24}$/;
const legacyOwner = 'local-demo';
const scryptOptions = { N: 16384, r: 8, p: 1 };
const tokenPattern = /^[A-Za-z0-9_-]{16,100}$/;

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}

function field(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = Buffer.from(await scrypt(password, salt, 64, scryptOptions));
  return salt.toString('hex') + ':' + key.toString('hex');
}

async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = String(stored || '').split(':');
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  if (!expected.length) return false;
  const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, scryptOptions));
  return timingSafeEqual(actual, expected);
}

function readToken(cookieHeader) {
  const entry = String(cookieHeader || '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='));
  if (!entry) return '';
  const token = entry.slice(cookieName.length + 1);
  return tokenPattern.test(token) ? token : '';
}

export function createAuth(db, options = {}) {
  const adoptLegacyUser = (options.adoptLegacyUser || '').trim().toLowerCase();
  const bucket = options.bucket || null;
  const adminList = (options.adminUsernames || '').split(',').map(item => item.trim()).filter(Boolean);
  const attempts = new Map();
  let checks = 0;

  // 用户身份：核心管理员 / 管理员 / 普通用户。
  // 环境变量管理员名单 > 数据库 core_admin（仅旧本地库存在）> 数据库 admin（管理员）> user。
  const effectiveRole = user => adminList.includes(user.username) ? 'core_admin'
    : user.role === 'core_admin' ? 'core_admin'
    : user.role === 'admin' ? 'admin' : 'user';

  async function resolveUser(token) {
    const now = new Date().toISOString();
    const user = await db.prepare(`SELECT u.id, u.username, u.nickname, u.avatar, u.role FROM sessions s
      JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`).bind(token, now).first();
    if (!user) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    else user.role = effectiveRole(user);
    return user;
  }

  async function resolveSession(cookieHeader) {
    const token = readToken(cookieHeader);
    if (!token) return null;
    checks = (checks + 1) % 50;
    if (checks === 0) await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(new Date().toISOString()).run();
    return await resolveUser(token);
  }

  function clientIp(request) {
    return String(request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  }

  function tooMany(ip) {
    const entry = attempts.get(ip);
    if (!entry) return false;
    if (Date.now() > entry.resetAt) {
      attempts.delete(ip);
      return false;
    }
    return entry.count >= 12;
  }

  function noteFailure(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now > entry.resetAt) attempts.set(ip, { count: 1, resetAt: now + 600_000 });
    else entry.count += 1;
    if (attempts.size > 1000) attempts.clear();
  }

  function checkOrigin(request) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) throw new AuthError(403, '请从作品页面提交。');
  }

  function cookie(token, secure, maxAge) {
    return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  }

  async function createSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    await db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(token, userId, now.toISOString(), new Date(now.getTime() + sessionDays * 86_400_000).toISOString()).run();
    return token;
  }

  async function readJson(request, limit = 16_384) {
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let body = '';
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) throw new AuthError(413, '提交内容过大。');
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    }
    try {
      const value = JSON.parse(body);
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
      return value;
    } catch {
      throw new AuthError(400, '无法读取提交内容。');
    }
  }

  async function adoptLegacy(userId) {
    await db.batch([
      db.prepare('UPDATE animals SET owner = ? WHERE owner = ?').bind(userId, legacyOwner),
      db.prepare('UPDATE observations SET owner = ? WHERE owner = ?').bind(userId, legacyOwner),
      db.prepare('UPDATE bookmarks SET owner = ? WHERE owner = ?').bind(userId, legacyOwner),
      db.prepare('UPDATE people_profiles SET account_id = ? WHERE account_id = ?').bind(userId, legacyOwner),
      db.prepare('UPDATE event_access_requests SET account_id = ? WHERE account_id = ?').bind(userId, legacyOwner),
    ]);
  }

  async function register(request, secure) {
    checkOrigin(request);
    const ip = clientIp(request);
    if (tooMany(ip)) throw new AuthError(429, '尝试次数过多，请稍后再试。');
    const input = await readJson(request);
    const username = field(input.username).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    if (!usernamePattern.test(username)) throw new AuthError(400, '用户名为 3–24 位英文字母、数字、下划线或连字符。');
    if (password.length < 8 || password.length > 128) throw new AuthError(400, '密码至少 8 位。');
    if (await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()) {
      throw new AuthError(409, '这个用户名已被注册。');
    }
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, username, nickname, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, username, username, await hashPassword(password), new Date().toISOString()).run();
    if (adoptLegacyUser === username) await adoptLegacy(id);
    const token = await createSession(id);
    return json({ signedIn: true, username, nickname: username }, 201, { 'Set-Cookie': cookie(token, secure, sessionDays * 86_400) });
  }

  async function login(request, secure) {
    checkOrigin(request);
    const ip = clientIp(request);
    if (tooMany(ip)) throw new AuthError(429, '尝试次数过多，请稍后再试。');
    const input = await readJson(request);
    const username = field(input.username).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    const user = await db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').bind(username).first();
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      noteFailure(ip);
      throw new AuthError(401, '用户名或密码不正确。');
    }
    const token = await createSession(user.id);
    attempts.delete(ip);
    return json({ signedIn: true, username: user.username }, 200, { 'Set-Cookie': cookie(token, secure, sessionDays * 86_400) });
  }

  async function logout(request, secure) {
    checkOrigin(request);
    const token = readToken(request.headers.get('Cookie') || '');
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return json({ signedIn: false }, 200, { 'Set-Cookie': cookie('', secure, 0) });
  }

  async function me(request) {
    const user = await resolveSession(request.headers.get('Cookie') || '');
    const role = user?.role || 'user';
    return json({
      signedIn: !!user, username: user?.username || '', nickname: (user?.nickname || user?.username || ''),
      avatar: user?.avatar || '', role, admin: role !== 'user', coreAdmin: role === 'core_admin',
    });
  }

  async function account(request) {
    const user = await resolveSession(request.headers.get('Cookie') || '');
    if (!user) throw new AuthError(401, '请先登录。');
    checkOrigin(request);
    // 头像为 400px 以内的 JPEG dataURL，放宽请求体上限；登录注册保持默认 16KB。
    const input = await readJson(request, 1_600_000);
    const nickname = field(input.nickname).slice(0, 24);
    let photo;
    try {
      photo = cleanJpeg(input.avatar);
    } catch (error) {
      throw new AuthError(error.status || 400, error.message);
    }
    if (photo && input.avatarConsent !== true) throw new AuthError(400, '请确认头像可以公开显示。');
    const photoId = photo ? crypto.randomUUID() : '';
    if (photo) await bucket.put(photoId, photo, { httpMetadata: { contentType: 'image/jpeg' } });
    const remove = input.removeAvatar === true && !!user.avatar;
    if ((photo || remove) && user.avatar) await bucket.delete(user.avatar.slice(7));
    await db.prepare(`UPDATE users SET nickname = CASE WHEN ? <> '' THEN ? ELSE nickname END,
      avatar = CASE WHEN ? THEN ? WHEN ? THEN '' ELSE avatar END WHERE id = ?`)
      .bind(nickname, nickname, Number(!!photo), photo ? '/media/' + photoId : '', Number(remove), user.id).run();
    const fresh = await db.prepare('SELECT username, nickname, avatar FROM users WHERE id = ?').bind(user.id).first();
    return json({ signedIn: true, username: fresh.username, nickname: fresh.nickname || fresh.username, avatar: fresh.avatar || '' });
  }

  async function handle(request, secure) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/auth/register' && request.method === 'POST') return await register(request, secure);
      if (pathname === '/api/auth/login' && request.method === 'POST') return await login(request, secure);
      if (pathname === '/api/auth/logout' && request.method === 'POST') return await logout(request, secure);
      if (pathname === '/api/auth/account' && request.method === 'POST') return await account(request);
      if (pathname === '/api/auth/me' && request.method === 'GET') return await me(request);
      return json({ error: '找不到此页面。' }, 404);
    } catch (error) {
      if (error instanceof AuthError) return json({ error: error.message }, error.status);
      console.error('Auth failure', error.stack || error);
      return json({ error: '服务暂时不可用，请稍后重试。' }, 500);
    }
  }

  return { handle, resolveSession };
}

