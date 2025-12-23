DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS albums;

CREATE TABLE albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_id INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  alt TEXT,
  album_id INTEGER REFERENCES albums(id),
  created_at INTEGER DEFAULT (unixepoch())
);
