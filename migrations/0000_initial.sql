CREATE TABLE animals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  species TEXT NOT NULL,
  features TEXT NOT NULL,
  personality TEXT NOT NULL,
  likes TEXT NOT NULL,
  photo TEXT NOT NULL,
  owner TEXT NOT NULL
);

CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  animal_id TEXT,
  owner TEXT NOT NULL,
  category TEXT NOT NULL,
  species TEXT NOT NULL,
  area TEXT NOT NULL,
  kind TEXT NOT NULL,
  note TEXT NOT NULL,
  photo TEXT NOT NULL,
  observed_at TEXT NOT NULL
);

CREATE INDEX observation_animal_date ON observations(animal_id, observed_at);
CREATE INDEX observation_owner ON observations(owner);

CREATE TABLE bookmarks (
  owner TEXT NOT NULL,
  animal_id TEXT NOT NULL,
  PRIMARY KEY (owner, animal_id)
);
