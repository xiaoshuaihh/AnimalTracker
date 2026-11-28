-- 动物档案：物种改为标签（与观察记录同体系，按动物类别区分）。
-- 已有物种值自动迁移为档案的第一个标签；species 列保留（观察记录仍引用历史物种快照）。
ALTER TABLE animals ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
UPDATE animals SET tags = json_array(species) WHERE species <> '' AND tags = '[]';

DROP VIEW public_animals;
CREATE VIEW public_animals AS
SELECT a.rowid AS creation_order, a.id, a.name, a.category, a.species, a.features, a.personality, a.likes, a.gender, a.health, a.tags, a.owner,
  CASE WHEN EXISTS (
    SELECT 1 FROM observations o WHERE o.photo = a.photo AND o.photo <> '' AND o.kind <> '日常观察'
  ) THEN '' ELSE a.photo END AS photo
FROM animals a
WHERE NOT EXISTS (
  SELECT 1 FROM observations o WHERE o.id = a.id AND o.animal_id = a.id AND o.kind <> '日常观察'
);
