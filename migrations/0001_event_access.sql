CREATE TABLE event_access_requests (
  account_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('animal_welfare', 'campus_management')),
  affiliation TEXT NOT NULL,
  campus_email TEXT NOT NULL,
  identity_match INTEGER NOT NULL CHECK (identity_match IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX observation_photo ON observations(photo) WHERE photo <> '';
CREATE INDEX observation_kind_date ON observations(kind, observed_at);

CREATE VIEW public_animals AS
SELECT a.rowid AS creation_order, a.id, a.name, a.category, a.species, a.features, a.personality, a.likes, a.owner,
  CASE WHEN EXISTS (
    SELECT 1 FROM observations o WHERE o.photo = a.photo AND o.photo <> '' AND o.kind <> '日常观察'
  ) THEN '' ELSE a.photo END AS photo
FROM animals a
WHERE NOT EXISTS (
  SELECT 1 FROM observations o WHERE o.id = a.id AND o.animal_id = a.id AND o.kind <> '日常观察'
);
