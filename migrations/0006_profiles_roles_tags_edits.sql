-- 角色调整：取消「审核员」。用户身份为 核心管理员 / 管理员 / 普通用户。
-- 原「审核员」回归普通用户。数据库中的 role = 'admin' 表示「管理员」；
-- 「核心管理员」由服务端 EVENT_ADMIN_USERNAMES 指定，不写入数据库。
-- 说明：为兼容 Cloudflare D1（不支持 ALTER TABLE ... RENAME TO，无法重建表更换
-- CHECK 约束），保留 0005 的旧 CHECK（'user','reviewer','admin'），其中 'reviewer'
-- 值不再使用；'core_admin' 仅出现在本地开发库（本地曾以重建表方式迁移），
-- 服务端角色判断对两种库结构均兼容。
UPDATE users SET role = 'user' WHERE role = 'reviewer';

-- 动物档案：性别与健康状况。
ALTER TABLE animals ADD COLUMN gender TEXT NOT NULL DEFAULT '';
ALTER TABLE animals ADD COLUMN health TEXT NOT NULL DEFAULT '';

-- 观察记录：标签（JSON 数组文本，按动物类别区分）。
ALTER TABLE observations ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';

DROP VIEW public_animals;
CREATE VIEW public_animals AS
SELECT a.rowid AS creation_order, a.id, a.name, a.category, a.species, a.features, a.personality, a.likes, a.gender, a.health, a.owner,
  CASE WHEN EXISTS (
    SELECT 1 FROM observations o WHERE o.photo = a.photo AND o.photo <> '' AND o.kind <> '日常观察'
  ) THEN '' ELSE a.photo END AS photo
FROM animals a
WHERE NOT EXISTS (
  SELECT 1 FROM observations o WHERE o.id = a.id AND o.animal_id = a.id AND o.kind <> '日常观察'
);

-- 观察记录修改申请：普通用户申请修改他人记录，由管理员审核后应用。
CREATE TABLE observation_edits (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  requester TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);
CREATE INDEX edit_observation ON observation_edits(observation_id);
CREATE INDEX edit_status ON observation_edits(status);
CREATE UNIQUE INDEX edit_pending_requester ON observation_edits(observation_id, requester) WHERE status = 'pending';
