import { areas, kinds, samples, eventRoles, achievementsFor } from '../public/data.js';

const encoder = new TextEncoder();
const sampleIds = new Set(samples.map(animal => animal.id));
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/data.js', ['data.js', 'text/javascript; charset=utf-8']],
  ['/map.js', ['map.js', 'text/javascript; charset=utf-8']],
  ['/assets/cat.jpg', ['assets/cat.jpg', 'image/jpeg']],
  ['/assets/bird.jpg', ['assets/bird.jpg', 'image/jpeg']],
  ['/assets/dog.jpg', ['assets/dog.jpg', 'image/jpeg']],
  ['/assets/CUHKSZ_map.jpg', ['assets/CUHKSZ_map.jpg', 'image/jpeg']],
  ['/vendor/maplibre-gl.js', ['vendor/maplibre-gl.js', 'text/javascript; charset=utf-8']],
  ['/vendor/maplibre-gl.css', ['vendor/maplibre-gl.css', 'text/css; charset=utf-8']],
]);

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function field(value, maximum, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : fallback;
}

// 标签：字符串数组，去重、裁剪、上限 12 个。
function parseTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(item => typeof item === 'string')
    .map(item => item.trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
}

const storedTags = value => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter(tag => typeof tag === 'string') : [];
  } catch {
    return [];
  }
};

const storedJson = value => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

function requireViewer(request) {
  const viewer = request.headers.get('oai-authenticated-user-id');
  if (!viewer) throw new RequestError(401, '请先登录，再发布记录或收藏档案。');
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) throw new RequestError(403, '请从作品页面提交。');
  return viewer;
}

export function cleanJpeg(value) {
  if (!value) return null;
  const prefix = 'data:image/jpeg;base64,';
  if (typeof value !== 'string' || !value.startsWith(prefix) || value.length > 3_000_000) {
    throw new RequestError(400, '照片过大，请重新选择较小的照片。');
  }
  let bytes;
  try {
    bytes = Uint8Array.from(atob(value.slice(prefix.length)), char => char.charCodeAt(0));
  } catch {
    throw new RequestError(400, '照片格式有误，请重新选择。');
  }
  const invalid = () => { throw new RequestError(400, '照片无法读取或包含原始相机信息，请重新选择。'); };
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) invalid();
  let offset = 2;
  while (offset < bytes.length - 3) {
    if (bytes[offset] !== 255) invalid();
    const marker = bytes[offset + 1];
    if (marker === 218) return bytes;
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (length < 2) invalid();
    if ((marker >= 225 && marker <= 239) || marker === 254) {
      // 移除 APPn/COM 元数据段（可能含相机、位置等信息），保留图像本身。
      const stripped = new Uint8Array(bytes.length - 2 - length);
      stripped.set(bytes.subarray(0, offset));
      stripped.set(bytes.subarray(offset + 2 + length), offset);
      bytes = stripped;
      continue;
    }
    offset += 2 + length;
  }
  invalid();
}

async function payload(request) {
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3_100_000) {
        await reader.cancel();
        throw new RequestError(413, '提交内容过大，请换一张较小的照片。');
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  }
  try {
    const value = JSON.parse(body);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch {
    throw new RequestError(400, '无法读取提交内容。');
  }
}

const animalFields = 'id, name, category, species, features, personality, likes, gender, health, tags, photo';
const visitFields = 'id, animal_id, category, species, area, kind, note, photo, observed_at, media, media_type, tags';

async function bootstrap(request, env) {
  const viewer = request.headers.get('oai-authenticated-user-id') || '';
  const admin = viewerRole(request, env) !== 'user';
  // 示例动物档案与示例观察写在前端 data.js，由服务端开关控制是否下发（WILDLIFE_DEMO_DATA=0 时关闭）。
  const demo = env.WILDLIFE_DEMO_DATA !== '0';
  const [animals, visits, bookmarks, edits] = await env.DB.batch([
    env.DB.prepare(`SELECT ${animalFields}, (owner = ? OR ? = 1) AS editable FROM public_animals ORDER BY creation_order DESC`).bind(viewer, Number(admin)),
    env.DB.prepare(`SELECT o.id, o.animal_id, o.category, o.species, o.area, o.kind, o.note, o.photo, o.observed_at, o.media, o.media_type, o.tags, (o.owner = ?) AS mine, (o.owner = ? OR ? = 1) AS editable,
      COALESCE(NULLIF(u.nickname, ''), u.username) AS author, COALESCE(u.avatar, '') AS author_avatar
      FROM observations o LEFT JOIN users u ON u.id = o.owner WHERE o.kind = ? ORDER BY o.observed_at DESC, o.rowid DESC`).bind(viewer, viewer, Number(admin), kinds[0]),
    env.DB.prepare('SELECT animal_id FROM bookmarks WHERE owner = ?').bind(viewer),
    env.DB.prepare("SELECT observation_id, status FROM observation_edits WHERE requester = ? AND status = 'pending'").bind(viewer),
  ]);
  return json({
    animals: animals.results.map(animal => ({ ...animal, tags: storedTags(animal.tags) })),
    visits: visits.results.map(visit => ({ ...visit, tags: storedTags(visit.tags) })),
    bookmarks: bookmarks.results.map(row => row.animal_id).filter(id => (demo && sampleIds.has(id)) || animals.results.some(animal => animal.id === id)),
    edits: edits.results,
    fundraisers: fundraiserCatalog(env),
    signedIn: !!viewer, local: !!env.LOCAL_DEMO, demo,
  });
}

async function record(request, env, incident = false) {
  const viewer = requireViewer(request);
  const { input, file } = await recordPayload(request);
  const id = field(input.id, 45);
  const area = field(input.area, 30);
  const kind = field(input.kind, 20);
  const observed = new Date(input.observedAt);
  const photo = cleanJpeg(input.photo);
  const attachment = file ? await checkAttachment(file) : null;
  if (photo && attachment) throw new RequestError(400, '每条记录可附一份媒体。');
  if (attachment && (incident || input.mediaConsent !== true)) throw new RequestError(400, '请确认录音或视频可以公开展示。');
  if (!incident && input.format !== undefined) {
    const validFormat = (
      input.format === 'text' && !photo && !attachment && field(input.note, 400)
      || input.format === 'photo' && !!photo
      || ['audio','video'].includes(input.format) && attachment?.type.startsWith(input.format + '/')
    );
    if (!validFormat) throw new RequestError(400, '请提交与记录方式相符的文字或媒体。');
  }
  const customArea = typeof area === 'string' && area.startsWith('custom:') && area.length > 7;
  if (!/^[a-f0-9-]{36}$/.test(id) || !(customArea || areas.some(item => item.id === area)) || !(incident ? kinds.slice(1).includes(kind) : kind === kinds[0])) {
    throw new RequestError(400, '请选择校园区域和观察类型。');
  }
  if (typeof input.observedAt !== 'string' || !Number.isFinite(+observed) || +observed > Date.now() + 300_000) throw new RequestError(400, '请检查观察时间。');
  if (incident && input.eventConsent !== true) throw new RequestError(400, '请先阅读并确认事件记录说明。');
  if (photo && input.photoConsent !== true) throw new RequestError(400, '请确认这张照片适合分享。');
  const previous = await env.DB.prepare('SELECT owner, animal_id, kind FROM observations WHERE id = ?').bind(id).first();
  if (previous) {
    if (previous.owner !== viewer || previous.kind !== kind) throw new RequestError(409, '该观察编号已使用，请重新打开表单。');
    return json({ id, animalId: previous.animal_id });
  }
  const match = incident ? 'unknown' : field(input.match, 60);
  const tags = incident ? [] : parseTags(input.tags);
  let category = field(input.category, 30);
  let species = field(input.species, 60);
  let animalId = null;
  let existing = null;
  if (match === 'new') {
    if (!category || category === '待确认') throw new RequestError(400, '建立档案前，请确认动物类别。');
    animalId = id;
  } else if (match && match !== 'unknown') {
    existing = samples.find(animal => animal.id === match)
      || await env.DB.prepare('SELECT id, category, species FROM public_animals WHERE id = ?').bind(match).first();
    if (!existing) throw new RequestError(404, '找不到选中的动物档案。');
    animalId = existing.id;
    category = existing.category;
    species = existing.species || species;
  }
  category ||= '待确认';
  const photoId = photo ? crypto.randomUUID() : '';
  const link = photo ? '/media/' + photoId : '';
  const mediaId = attachment ? crypto.randomUUID() : '';
  const media = attachment ? '/media/' + mediaId : '';
  const statements = [];
  if (match === 'new') {
    statements.push(env.DB.prepare(`INSERT INTO animals (${animalFields}, owner) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM observations WHERE id = ?) ON CONFLICT(id) DO NOTHING`).bind(
      id, field(input.name, 40) || '未命名的' + category, category, species, field(input.features, 180),
      field(input.personality, 140), field(input.likes, 140), field(input.gender, 30), field(input.health, 200), JSON.stringify(tags), link, viewer, id,
    ));
  } else if (existing && !sampleIds.has(existing.id) && link) {
    statements.push(env.DB.prepare("UPDATE animals SET photo = ? WHERE id = ? AND photo = '' AND NOT EXISTS (SELECT 1 FROM observations WHERE id = ?)").bind(link, animalId, id));
  }
  statements.push(env.DB.prepare(`INSERT INTO observations (${visitFields}, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(
    id, animalId, category, species, area, kind, field(input.note, 400), link, observed.toISOString(), media, attachment?.type || '', JSON.stringify(tags), viewer,
  ));
  if (photo) await env.BUCKET.put(photoId, photo, { httpMetadata: { contentType: 'image/jpeg' } });
  if (attachment) await env.BUCKET.put(mediaId, await file.arrayBuffer(), { httpMetadata: { contentType: attachment.type } });
  const results = await env.DB.batch(statements);
  if (!results.at(-1).meta.changes) {
    if (photo) await env.BUCKET.delete(photoId);
    if (attachment) await env.BUCKET.delete(mediaId);
    const winner = await env.DB.prepare('SELECT owner, animal_id, kind FROM observations WHERE id = ?').bind(id).first();
    if (winner.owner !== viewer || winner.kind !== kind) throw new RequestError(409, '该观察编号已使用，请重新打开表单。');
    return json({ id, animalId: winner.animal_id });
  }
  return json({ id, animalId }, 201);
}

async function bookmark(request, env) {
  const viewer = requireViewer(request);
  const input = await payload(request);
  const animal = field(input.animalId, 60);
  const exists = sampleIds.has(animal) || await env.DB.prepare('SELECT 1 FROM public_animals WHERE id = ?').bind(animal).first();
  if (!exists) throw new RequestError(404, '找不到动物档案。');
  if (typeof input.saved !== 'boolean') throw new RequestError(400, '请选择是否收藏。');
  const query = input.saved
    ? 'INSERT OR IGNORE INTO bookmarks (owner, animal_id) VALUES (?, ?)'
    : 'DELETE FROM bookmarks WHERE owner = ? AND animal_id = ?';
  await env.DB.prepare(query).bind(viewer, animal).run();
  return json({ saved: input.saved });
}

async function editProfile(request, env) {
  const viewer = requireViewer(request);
  const admin = isAdmin(request, env);
  const input = await payload(request);
  const id = field(input.id, 60);
  const name = field(input.name, 40);
  if (!name) throw new RequestError(400, '请填写档案名称。');
  const result = await env.DB.prepare('UPDATE animals SET name = ?, personality = ?, likes = ?, features = ?, gender = ?, health = ?, tags = ?, species = COALESCE(?, species) WHERE id = ? AND (owner = ? OR ? = 1) AND id IN (SELECT id FROM public_animals)')
    .bind(name, field(input.personality, 140), field(input.likes, 140), field(input.features, 180), field(input.gender, 30), field(input.health, 200), JSON.stringify(parseTags(input.tags)), typeof input.species === 'string' ? field(input.species, 60) : null, id, viewer, Number(admin)).run();
  if (!result.meta.changes) throw new RequestError(404, '只有档案创建者或管理员可以修改该档案。');
  return json({ id });
}

async function createAnimal(request, env) {
  const viewer = requireViewer(request);
  const input = await payload(request);
  const name = field(input.name, 40);
  const category = field(input.category, 30);
  if (!name || !category || category === '待确认') throw new RequestError(400, '请填写动物名称和类别。');
  const id = crypto.randomUUID();
  const photo = cleanJpeg(input.photo);
  if (photo && input.photoConsent !== true) throw new RequestError(400, '请确认这张照片可公开展示。');
  const photoId = photo ? crypto.randomUUID() : '';
  if (photo) await env.BUCKET.put(photoId, photo, { httpMetadata: { contentType: 'image/jpeg' } });
  await env.DB.prepare(`INSERT INTO animals (${animalFields}, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, name, category, field(input.species, 60), field(input.features, 180),
    field(input.personality, 140), field(input.likes, 140), field(input.gender, 30), field(input.health, 200), JSON.stringify(parseTags(input.tags)), photo ? '/media/' + photoId : '', viewer,
  ).run();
  return json({ id }, 201);
}

// 用户身份：核心管理员 / 管理员 / 普通用户（已取消审核员）。
// 核心管理员由服务端 EVENT_ADMIN_USERNAMES 指定（原管理员升级）；管理员由核心管理员在后台设置。
function viewerRole(request, env) {
  const username = request.headers.get('oai-authenticated-user-name')?.trim();
  const admins = (env.EVENT_ADMIN_USERNAMES || '').split(',').map(item => item.trim()).filter(Boolean);
  if (username && admins.includes(username)) return 'core_admin';
  const role = request.headers.get('oai-authenticated-user-role')?.trim();
  if (role === 'core_admin') return 'core_admin';
  if (role === 'admin') return 'admin';
  return 'user';
}

// 管理员与核心管理员：均可审核事件权限申请、审核修改申请、修改与删除观察记录和动物档案、管理全部事件。
function canReview(request, env) {
  return viewerRole(request, env) !== 'user';
}

function isAdmin(request, env) {
  return viewerRole(request, env) !== 'user';
}

function isCoreAdmin(request, env) {
  return viewerRole(request, env) === 'core_admin';
}

async function currentApplication(env, viewer) {
  return await env.DB.prepare('SELECT role, affiliation, status, submitted_at, reviewed_at FROM event_access_requests WHERE account_id = ?')
    .bind(viewer).first();
}

async function listEvents(request, env) {
  const viewer = requireViewer(request);
  const application = await currentApplication(env, viewer);
  const status = application?.status;
  const admin = isAdmin(request, env);
  const canViewAll = admin || status === 'approved';
  const { results } = await env.DB.prepare(`SELECT id, category, area, kind, observed_at, (owner = ?) AS mine FROM observations
    WHERE kind <> ? AND (owner = ? OR EXISTS (
      SELECT 1 FROM event_access_requests WHERE account_id = ? AND status = 'approved'
    ) OR ? = 1) ORDER BY observed_at DESC, rowid DESC`).bind(viewer, kinds[0], viewer, viewer, Number(admin)).all();
  return json({ events: results, application, canViewAll, canReview: canReview(request, env), admin });
}

async function eventDetail(request, env, id) {
  const viewer = requireViewer(request);
  const event = await env.DB.prepare(`SELECT ${visitFields} FROM observations WHERE id = ? AND kind <> ?
    AND (owner = ? OR EXISTS (SELECT 1 FROM event_access_requests WHERE account_id = ? AND status = 'approved') OR ? = 1)`)
    .bind(id, kinds[0], viewer, viewer, Number(isAdmin(request, env))).first();
  if (!event) throw new RequestError(404, '找不到该事件。');
  return json({ event });
}

async function applyEventAccess(request, env) {
  const viewer = requireViewer(request);
  const input = await payload(request);
  const affiliation = field(input.affiliation, 120);
  const campusEmail = field(input.campusEmail, 120).toLowerCase();
  if (!/^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)*cuhk\.edu\.cn$/.test(campusEmail)) {
    throw new RequestError(400, '请填写香港中文大学（深圳）校内邮箱。');
  }
  const identityMatch = Number(request.headers.get('oai-authenticated-user-email')?.toLowerCase() === campusEmail);
  if (!Object.hasOwn(eventRoles, input.role) || !affiliation || input.acknowledged !== true) {
    throw new RequestError(400, '请选择身份、填写所属组织或部门并确认权限说明。');
  }
  const current = await currentApplication(env, viewer);
  if (current?.status === 'pending' || current?.status === 'approved') return json({ application: current });
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO event_access_requests
      (account_id, request_id, role, affiliation, campus_email, identity_match, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    ON CONFLICT(account_id) DO UPDATE SET request_id = excluded.request_id, role = excluded.role, affiliation = excluded.affiliation,
      campus_email = excluded.campus_email, identity_match = excluded.identity_match,
      status = 'pending', submitted_at = excluded.submitted_at, reviewed_at = NULL, reviewed_by = NULL
    WHERE event_access_requests.status IN ('rejected', 'revoked')`).bind(viewer, crypto.randomUUID(), input.role, affiliation, campusEmail, identityMatch, now).run();
  return json({ application: await currentApplication(env, viewer) }, 201);
}

async function reviewEventAccess(request, env) {
  const viewer = requireViewer(request);
  if (!canReview(request, env)) throw new RequestError(403, '此操作需要管理员身份。');
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT request_id, role, affiliation, campus_email, identity_match, status, submitted_at, reviewed_at,
      (account_id = ?) AS own_request FROM event_access_requests ORDER BY submitted_at DESC`).bind(viewer).all();
    return json({ applications: results });
  }
  const input = await payload(request);
  const decisions = { approve: ['pending', 'approved'], reject: ['pending', 'rejected'], revoke: ['approved', 'revoked'] };
  if (!Object.hasOwn(decisions, input.decision)) throw new RequestError(400, '请选择审核操作。');
  const [previous, next] = decisions[input.decision];
  const result = await env.DB.prepare(`UPDATE event_access_requests SET status = ?, reviewed_at = ?, reviewed_by = ?
    WHERE request_id = ? AND status = ? AND account_id <> ?`).bind(
    next, new Date().toISOString(), viewer, field(input.id, 45), previous, viewer,
  ).run();
  if (!result.meta.changes) throw new RequestError(409, '申请已变更，或这是你自己的申请。请刷新审核列表。');
  return json({ status: next });
}

async function adminEventList(request, env) {
  requireViewer(request);
  if (!isAdmin(request, env)) throw new RequestError(403, '此操作需要管理员身份。');
  const { results } = await env.DB.prepare(`SELECT o.id, o.kind, o.category, o.area, o.observed_at,
    COALESCE(NULLIF(u.nickname, ''), u.username) AS author
    FROM observations o LEFT JOIN users u ON u.id = o.owner
    WHERE o.kind <> ? ORDER BY o.observed_at DESC, o.rowid DESC`).bind(kinds[0]).all();
  return json({ events: results });
}

async function removeEvent(request, env) {
  requireViewer(request);
  if (!isAdmin(request, env)) throw new RequestError(403, '此操作需要管理员身份。');
  const input = await payload(request);
  const id = field(input.id, 45);
  const event = await env.DB.prepare(`SELECT ${visitFields} FROM observations WHERE id = ? AND kind <> ?`).bind(id, kinds[0]).first();
  if (!event) throw new RequestError(404, '找不到该事件。');
  await env.DB.prepare('DELETE FROM observations WHERE id = ?').bind(id).run();
  if (event.photo) await env.BUCKET.delete(event.photo.slice(7));
  if (event.media) await env.BUCKET.delete(event.media.slice(7));
  return json({ id });
}

async function adminUsers(request, env) {
  requireViewer(request);
  if (!isCoreAdmin(request, env)) throw new RequestError(403, '此操作需要核心管理员身份。');
  // 核心管理员由 EVENT_ADMIN_USERNAMES 指定（旧本地库也可能存有 role='core_admin'），
  // 列表展示与修改校验都按「有效角色」计算。
  const envAdmins = (env.EVENT_ADMIN_USERNAMES || '').split(',').map(item => item.trim()).filter(Boolean);
  const effectiveRole = row => envAdmins.includes(row.username) ? 'core_admin'
    : row.role === 'core_admin' ? 'core_admin' : row.role === 'admin' ? 'admin' : 'user';
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, username, nickname, role, created_at FROM users ORDER BY created_at DESC LIMIT 500').all();
    return json({ users: results.map(user => ({ ...user, role: effectiveRole(user) })) });
  }
  const input = await payload(request);
  const username = field(input.username).toLowerCase();
  const role = field(input.role);
  if (!['user', 'admin'].includes(role)) throw new RequestError(400, '请选择有效的角色。');
  if (username === request.headers.get('oai-authenticated-user-name')?.trim()) throw new RequestError(409, '不能修改自己的角色。');
  const target = await env.DB.prepare('SELECT username, role FROM users WHERE username = ?').bind(username).first();
  if (!target) throw new RequestError(404, '找不到该用户。');
  if (effectiveRole(target) === 'core_admin') throw new RequestError(409, '核心管理员由服务器配置指定，不可在此修改。');
  await env.DB.prepare('UPDATE users SET role = ? WHERE username = ?').bind(role, username).run();
  return json({ username, role });
}

const mediaLimit = 25 * 1024 * 1024;

// 校验修改观察记录的字段：仅允许时间、地点、动物标签、关联档案与观察文字。
function editFields(input, category) {
  const observed = new Date(input.observedAt);
  if (typeof input.observedAt !== 'string' || !Number.isFinite(+observed) || +observed > Date.now() + 300_000) throw new RequestError(400, '请检查观察时间。');
  const area = field(input.area, 120);
  const customArea = typeof area === 'string' && area.startsWith('custom:') && area.length > 7;
  if (!(customArea || areas.some(item => item.id === area))) throw new RequestError(400, '请选择校园区域。');
  const match = ['unknown', 'existing', 'new'].includes(input.match) ? input.match : 'unknown';
  const fields = {
    observedAt: observed.toISOString(),
    area,
    tags: parseTags(input.tags),
    note: field(input.note, 400),
    match,
    animalId: match === 'existing' ? field(input.animalId, 60) : '',
    name: field(input.name, 40),
    features: field(input.features, 180),
    personality: field(input.personality, 140),
    likes: field(input.likes, 140),
    gender: field(input.gender, 30),
    health: field(input.health, 200),
  };
  if (match === 'existing' && !fields.animalId) throw new RequestError(400, '请选择关联的动物档案。');
  if (match === 'new' && !category) throw new RequestError(400, '请确认动物类别。');
  return fields;
}

async function applyObservationEdit(env, id, visit, fields) {
  let animalId = null;
  if (fields.match === 'existing') {
    const existing = samples.find(animal => animal.id === fields.animalId)
      || await env.DB.prepare('SELECT id FROM public_animals WHERE id = ?').bind(fields.animalId).first();
    if (!existing) throw new RequestError(404, '找不到选中的动物档案。');
    animalId = existing.id;
  } else if (fields.match === 'new') {
    animalId = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO animals (${animalFields}, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      animalId, fields.name || '未命名的' + visit.category, visit.category, visit.species || '', fields.features,
      fields.personality, fields.likes, fields.gender, fields.health, JSON.stringify(fields.tags), '', visit.owner,
    ).run();
  }
  await env.DB.prepare('UPDATE observations SET observed_at = ?, area = ?, note = ?, tags = ?, animal_id = ? WHERE id = ?')
    .bind(fields.observedAt, fields.area, fields.note, JSON.stringify(fields.tags), animalId, id).run();
  return animalId;
}

async function editObservation(request, env) {
  const viewer = requireViewer(request);
  const input = await payload(request);
  const id = field(input.id, 45);
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new RequestError(400, '记录编号有误。');
  const visit = await env.DB.prepare(`SELECT ${visitFields}, owner FROM observations WHERE id = ? AND kind = ?`).bind(id, kinds[0]).first();
  if (!visit) throw new RequestError(404, '找不到这条观察记录。');
  const admin = isAdmin(request, env);
  const fields = editFields(input, visit.category);
  // 本人或管理员：直接修改；他人记录：提交修改申请，等待管理员审核。
  if (admin || visit.owner === viewer) {
    const animalId = await applyObservationEdit(env, id, visit, fields);
    return json({ id, pending: false, animalId });
  }
  await env.DB.prepare(`INSERT INTO observation_edits (id, observation_id, requester, payload, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)
    ON CONFLICT(observation_id, requester) WHERE status = 'pending' DO UPDATE SET payload = excluded.payload, created_at = excluded.created_at`)
    .bind(crypto.randomUUID(), id, viewer, JSON.stringify(fields), new Date().toISOString()).run();
  return json({ id, pending: true }, 201);
}

async function removeObservation(request, env) {
  requireViewer(request);
  if (!isAdmin(request, env)) throw new RequestError(403, '此操作需要管理员身份。');
  const input = await payload(request);
  const id = field(input.id, 45);
  const visit = await env.DB.prepare(`SELECT ${visitFields} FROM observations WHERE id = ? AND kind = ?`).bind(id, kinds[0]).first();
  if (!visit) throw new RequestError(404, '找不到这条观察记录。');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM observations WHERE id = ?').bind(id),
    env.DB.prepare('DELETE FROM observation_edits WHERE observation_id = ?').bind(id),
  ]);
  if (visit.photo) await env.BUCKET.delete(visit.photo.slice(7));
  if (visit.media) await env.BUCKET.delete(visit.media.slice(7));
  return json({ id });
}
async function adminEdits(request, env) {
  const viewer = requireViewer(request);
  if (!isAdmin(request, env)) throw new RequestError(403, '此操作需要管理员身份。');
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT e.id, e.observation_id, e.payload, e.status, e.created_at,
      COALESCE(NULLIF(u.nickname, ''), u.username) AS requester
      FROM observation_edits e LEFT JOIN users u ON u.id = e.requester
      WHERE e.status = 'pending' ORDER BY e.created_at DESC LIMIT 200`).all();
    return json({ edits: results.map(edit => ({ ...edit, payload: storedJson(edit.payload) })) });
  }
  const input = await payload(request);
  const decisions = { approve: ['pending', 'approved'], reject: ['pending', 'rejected'] };
  if (!Object.hasOwn(decisions, input.decision)) throw new RequestError(400, '请选择审核操作。');
  const [previous, next] = decisions[input.decision];
  const edit = await env.DB.prepare('SELECT id, observation_id, payload FROM observation_edits WHERE id = ? AND status = ?').bind(field(input.id, 45), previous).first();
  if (!edit) throw new RequestError(409, '申请已处理，或已被撤回。请刷新列表。');
  if (next === 'approved') {
    const visit = await env.DB.prepare(`SELECT ${visitFields}, owner FROM observations WHERE id = ? AND kind = ?`).bind(edit.observation_id, kinds[0]).first();
    if (!visit) {
      await env.DB.prepare("UPDATE observation_edits SET status = 'rejected', reviewed_at = ?, reviewed_by = ? WHERE id = ?")
        .bind(new Date().toISOString(), viewer, edit.id).run();
      throw new RequestError(409, '该观察记录已不存在，申请已驳回。');
    }
    const fields = editFields(storedJson(edit.payload), visit.category);
    await applyObservationEdit(env, visit.id, visit, fields);
  }
  await env.DB.prepare('UPDATE observation_edits SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?')
    .bind(next, new Date().toISOString(), viewer, edit.id).run();
  return json({ status: next });
}

const profileId = /^[a-z0-9_-]{3,24}$/;

async function recordPayload(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.startsWith('multipart/form-data;')) return { input: await payload(request) };
  const limit = mediaLimit + 64 * 1024;
  if (Number(request.headers.get('Content-Length')) > limit) throw new RequestError(413, '录音或视频大小不能超过 25 MB。');
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, '媒体文件为空。');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new RequestError(413, '录音或视频大小不能超过 25 MB。');
    }
    chunks.push(value);
  }
  try {
    const form = await new Response(new Blob(chunks), { headers: {'Content-Type': type} }).formData();
    const record = form.get('record');
    const file = form.get('file');
    if (typeof record !== 'string' || record.length > 8192 || !(file instanceof Blob)) throw new Error();
    const input = JSON.parse(record);
    if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error();
    return { input, file };
  } catch {
    throw new RequestError(400, '无法读取媒体文件或记录。');
  }
}

async function checkAttachment(file) {
  if (!file.size || file.size > mediaLimit) throw new RequestError(413, '请选择小于 25 MB 的录音或视频。');
  const prefix = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const match = (offset, marker) => [...marker].every((char, i) => prefix[offset + i] === char.charCodeAt(0));
  const webm = prefix[0] === 0x1a && prefix[1] === 0x45 && prefix[2] === 0xdf && prefix[3] === 0xa3;
  const mp4 = match(4, 'ftyp');
  const ogg = match(0, 'OggS');
  const wav = match(0, 'RIFF') && match(8, 'WAVE');
  const mp3 = match(0, 'ID3') || (prefix[0] === 255 && (prefix[1] & 224) === 224);
  const type = file.type.toLowerCase().split(';')[0];
  const matches = {
    'video/mp4': mp4, 'video/quicktime': mp4, 'video/webm': webm,
    'audio/mp4': mp4, 'audio/x-m4a': mp4, 'audio/webm': webm, 'audio/ogg': ogg,
    'audio/wav': wav, 'audio/wave': wav, 'audio/x-wav': wav, 'audio/mpeg': mp3,
  };
  if (!Object.hasOwn(matches, type) || !matches[type]) throw new RequestError(415, '视频支持 MP4、MOV、WebM。音频支持 M4A、WebM、Ogg、WAV、MP3。');
  return { type };
}

function fundraiserCatalog(env) {
  if (!env.CAT_FUNDRAISERS_JSON) return [];
  try {
    const entries = JSON.parse(env.CAT_FUNDRAISERS_JSON);
    if (!Array.isArray(entries)) return [];
    return entries.slice(0, 100).flatMap(entry => {
      const animalId = field(entry?.animalId, 60);
      const title = field(entry?.title, 60);
      const priceCents = entry?.priceCents;
      const link = field(entry?.link, 500);
      const valid = entry?.verified === true && animalId && title && Number.isInteger(priceCents) && priceCents > 0;
      if (!valid || !URL.canParse(link) || new URL(link).protocol !== 'https:' || new URL(link).username || new URL(link).password) return [];
      return [{ animalId, title, priceCents, link }];
    });
  } catch {
    return [];
  }
}

async function getMyProfile(request, env) {
  const viewer = requireViewer(request);
  const profile = await env.DB.prepare('SELECT handle, avatar, badges FROM people_profiles WHERE account_id = ?').bind(viewer).first();
  return json({ profile: profile ? {...profile, badges: JSON.parse(profile.badges)} : null });
}

async function saveMyProfile(request, env) {
  const viewer = requireViewer(request);
  const input = await payload(request);
  const handle = field(input.handle, 60).toLowerCase();
  if (!profileId.test(handle)) throw new RequestError(400, '用户 ID 须为 3–24 位英文字母、数字、下划线或连字符。');
  const known = achievementsFor([], []).map(([id]) => id);
  const badges = Array.isArray(input.badges) ? [...new Set(input.badges.filter(id => known.includes(id)))] : [];
  const photo = cleanJpeg(input.avatar);
  if (photo && input.avatarConsent !== true) throw new RequestError(400, '请确认头像可以公开展示。');
  const avatarId = photo ? crypto.randomUUID() : '';
  const avatar = photo ? '/media/' + avatarId : '';
  if (photo) await env.BUCKET.put(avatarId, photo, { httpMetadata: { contentType: 'image/jpeg' } });
  const result = await env.DB.prepare(`INSERT INTO people_profiles (account_id, handle, avatar, badges)
    SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM people_profiles WHERE handle = ? AND account_id <> ?)
    ON CONFLICT(account_id) DO UPDATE SET handle = excluded.handle, badges = excluded.badges,
    avatar = CASE WHEN ? THEN excluded.avatar ELSE people_profiles.avatar END`)
    .bind(viewer, handle, avatar, JSON.stringify(badges), handle, viewer, Number(!!photo || input.removeAvatar === true)).run();
  if (!result.meta.changes) {
    if (photo) await env.BUCKET.delete(avatarId);
    throw new RequestError(409, '这个用户 ID 已被占用。');
  }
  return getMyProfile(request, env);
}

async function publicPerson(env, handle) {
  if (!profileId.test(handle)) throw new RequestError(404, '找不到该个人主页。');
  const profile = await env.DB.prepare('SELECT account_id, handle, avatar, badges FROM people_profiles WHERE handle = ?').bind(handle).first();
  if (!profile) throw new RequestError(404, '找不到该个人主页。');
  const visible = new Set(JSON.parse(profile.badges));
  const [visits, bookmarks] = await env.DB.batch([
    env.DB.prepare(`SELECT o.category, COALESCE(NULLIF(a.species,''), o.species) AS species, o.area, o.animal_id, o.observed_at
      FROM observations o LEFT JOIN public_animals a ON a.id = o.animal_id WHERE o.owner = ? AND o.kind = ?`).bind(profile.account_id, kinds[0]),
    env.DB.prepare(`SELECT b.animal_id, (a.id IS NOT NULL) AS visible FROM bookmarks b
      LEFT JOIN public_animals a ON a.id = b.animal_id WHERE b.owner = ?`).bind(profile.account_id),
  ]);
  const earned = achievementsFor(visits.results, bookmarks.results.filter(row => row.visible || sampleIds.has(row.animal_id)).map(row => row.animal_id))
    .filter(([id, , , unlocked]) => unlocked && visible.has(id)).map(([id]) => id);
  return json({ profile: { handle: profile.handle, avatar: profile.avatar, badges: earned } });
}

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end && start < size ? { offset: start, length: end - start + 1 } : null;
}

async function readMedia(request, env, path) {
  const viewer = request.headers.get('oai-authenticated-user-id') || '';
  const incident = await env.DB.prepare('SELECT owner FROM observations WHERE photo = ? AND kind <> ?').bind(path, kinds[0]).first();
  let contentType = 'image/jpeg';
  if (incident) {
    if (!viewer || (incident.owner !== viewer && (await currentApplication(env, viewer))?.status !== 'approved' && !isAdmin(request, env))) {
      throw new RequestError(404, '找不到文件。');
    }
  } else {
    const entry = await env.DB.prepare(`SELECT media_type AS type FROM observations WHERE media = ? AND kind = ?
      UNION ALL SELECT 'image/jpeg' FROM observations WHERE photo = ? AND kind = ?
      UNION ALL SELECT 'image/jpeg' FROM public_animals WHERE photo = ?
      UNION ALL SELECT 'image/jpeg' FROM people_profiles WHERE avatar = ?
      UNION ALL SELECT 'image/jpeg' FROM users WHERE avatar = ? LIMIT 1`)
      .bind(path, kinds[0], path, kinds[0], path, path, path).first();
    if (!entry) throw new RequestError(404, '找不到文件。');
    contentType = entry.type;
  }
  const key = path.slice(7);
  const headers = new Headers({
    'Content-Type': contentType, 'Cache-Control': 'private, max-age=2592000, immutable', 'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  });
  let range;
  if (request.headers.has('Range') || request.method === 'HEAD') {
    const meta = await env.BUCKET.head(key);
    if (!meta) throw new RequestError(404, '找不到文件。');
    const size = meta.size;
    if (request.headers.has('Range')) {
      range = byteRange(request.headers.get('Range'), size);
      if (!range) {
        headers.set('Content-Range', 'bytes */' + size);
        return new Response(null, {status: 416, headers});
      }
      headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${size}`);
      headers.set('Content-Length', String(range.length));
    } else headers.set('Content-Length', String(size));
  }
  if (request.method === 'HEAD') return new Response(null, {status: range ? 206 : 200, headers});
  const item = await env.BUCKET.get(key, range ? {range} : undefined);
  if (!item) throw new RequestError(404, '找不到文件。');
  return new Response(item.body, {status: range ? 206 : 200, headers});
}

export function createHandler(readAsset) {
  return {
    async fetch(request, env) {
      const { pathname } = new URL(request.url);
      try {
        if (['GET', 'HEAD'].includes(request.method) && /^\/media\/[a-f0-9-]{36}$/.test(pathname)) return await readMedia(request, env, pathname);
        if (request.method === 'GET') {
          if (pathname === '/api/bootstrap') return await bootstrap(request, env);
          if (pathname === '/api/events') return await listEvents(request, env);
          if (pathname === '/api/events/review') return await reviewEventAccess(request, env);
          if (/^\/api\/events\/[a-f0-9-]{36}$/.test(pathname)) return await eventDetail(request, env, pathname.slice(12));
          if (pathname === '/api/admin/events') return await adminEventList(request, env);
          if (pathname === '/api/admin/users') return await adminUsers(request, env);
          if (pathname === '/api/admin/edits') return await adminEdits(request, env);
          if (pathname === '/api/me') return await getMyProfile(request, env);
          if (pathname.startsWith('/api/people/')) return await publicPerson(env, pathname.slice(12));
          if (assets.has(pathname)) {
            const [name, type] = assets.get(pathname);
            const body = await readAsset(name);
            // 缓存策略：入口文件不缓存；图片与第三方库缓存一天；脚本样式每次校验，保证更新即时生效。
            const cache = name === 'index.html' ? 'no-store'
              : name.startsWith('vendor/') || name.startsWith('assets/') ? 'public, max-age=86400'
              : 'no-cache';
            return new Response(typeof body === 'string' ? encoder.encode(body) : body, { headers: { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' } });
          }
        }
        if (request.method === 'POST') {
          if (pathname === '/api/me') return await saveMyProfile(request, env);
          if (pathname === '/api/animals') return await createAnimal(request, env);
          if (pathname === '/api/events') return await record(request, env, true);
          if (pathname === '/api/events/apply') return await applyEventAccess(request, env);
          if (pathname === '/api/events/review') return await reviewEventAccess(request, env);
          if (pathname === '/api/admin/events') return await removeEvent(request, env);
          if (pathname === '/api/admin/users') return await adminUsers(request, env);
          if (pathname === '/api/admin/edits') return await adminEdits(request, env);
          if (pathname === '/api/admin/observations') return await removeObservation(request, env);
          if (pathname === '/api/observations') return await record(request, env);
          if (pathname === '/api/observations/edit') return await editObservation(request, env);
          if (pathname === '/api/bookmark') return await bookmark(request, env);
          if (pathname === '/api/profile') return await editProfile(request, env);
        }
        return json({ error: '找不到此页面。' }, 404);
      } catch (error) {
        if (error instanceof RequestError) return json({ error: error.message }, error.status);
        console.error('Request failure', error.name);
        return json({ error: '服务暂时不可用，请稍后重试。' }, 500);
      }
    },
  };
}
