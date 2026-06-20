-- D1 foundation skeleton for the durable MVP.
-- Proof artifact only; the current prototype runtime does not execute it.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  series_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT,
  country_code TEXT,
  official_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'cancelled', 'archived')),
  recommended_theme TEXT CHECK (recommended_theme IN ('pop', 'standard', 'rock')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_kana TEXT,
  official_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stages (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  area_name TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, name)
);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES artists(id),
  stage_id TEXT NOT NULL REFERENCES stages(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'changed', 'cancelled', 'tentative')),
  source_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, stage_id, start_at),
  UNIQUE (event_id, artist_id, start_at)
);

CREATE TABLE IF NOT EXISTS stage_distances (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  to_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  minutes INTEGER NOT NULL CHECK (minutes >= 0),
  PRIMARY KEY (event_id, from_stage_id, to_stage_id)
);

CREATE TABLE IF NOT EXISTS event_sources (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('ticketing', 'official_site', 'x_post', 'image', 'pdf', 'manual')),
  url TEXT,
  r2_bucket TEXT,
  r2_key TEXT,
  title TEXT,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('official', 'operator_reviewed', 'user_submitted')),
  fetched_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_proposals (
  id TEXT PRIMARY KEY,
  target_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('create_event', 'update_event', 'update_timetable', 'merge_event')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'merged')),
  proposed_data_json TEXT NOT NULL,
  source_url TEXT,
  submitter_name TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_plans (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL UNIQUE,
  ownership_type TEXT NOT NULL CHECK (ownership_type IN ('anonymous', 'registered')),
  anonymous_user_id TEXT,
  display_name TEXT,
  theme TEXT NOT NULL DEFAULT 'standard' CHECK (theme IN ('pop', 'standard', 'rock')),
  note TEXT,
  expires_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_plan_entries (
  id TEXT PRIMARY KEY,
  user_plan_id TEXT NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  timetable_entry_id TEXT NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  selection_status TEXT NOT NULL CHECK (selection_status IN ('selected', 'maybe', 'hidden')),
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_plan_id, timetable_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_timetable_entries_event_start ON timetable_entries(event_id, start_at);
CREATE INDEX IF NOT EXISTS idx_event_sources_event ON event_sources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_proposals_status ON event_proposals(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_plans_event ON user_plans(event_id);
