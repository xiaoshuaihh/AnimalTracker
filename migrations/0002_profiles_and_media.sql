ALTER TABLE observations ADD COLUMN media TEXT NOT NULL DEFAULT '';
ALTER TABLE observations ADD COLUMN media_type TEXT NOT NULL DEFAULT '';
CREATE INDEX observation_media ON observations(media) WHERE media <> '';

CREATE TABLE people_profiles (
  account_id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  avatar TEXT NOT NULL DEFAULT '',
  badges TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX people_avatar ON people_profiles(avatar) WHERE avatar <> '';
