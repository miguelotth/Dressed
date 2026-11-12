-- Esquema inicial do LookLoop (PostgreSQL >= 14).
-- Identidade UUID gerada pela aplicação; todas as tabelas pessoais são associadas a user_id.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name varchar(60) NOT NULL,
  email varchar(254) NOT NULL,
  password_hash text NOT NULL,
  wardrobe_name varchar(80) NOT NULL DEFAULT 'Meu guarda-roupa',
  accent varchar(10) NOT NULL DEFAULT 'berry' CHECK (accent IN ('berry','lilac','rose')),
  daily_inspiration boolean NOT NULL DEFAULT true,
  styling_tips boolean NOT NULL DEFAULT true,
  email_updates boolean NOT NULL DEFAULT false,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_unique_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stored_name varchar(100) NOT NULL UNIQUE,
  original_name varchar(160) NOT NULL,
  mime_type varchar(20) NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp')),
  is_processed boolean NOT NULL DEFAULT false,
  source_image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS images_user_idx ON images(user_id);

CREATE TABLE IF NOT EXISTS clothes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(60) NOT NULL,
  category varchar(20) NOT NULL CHECK (category IN ('tops','bottoms','dresses','outerwear','shoes','bags','accessories')),
  color varchar(30) NOT NULL,
  hex char(7) NOT NULL,
  season varchar(20) NOT NULL CHECK (season IN ('Todas','Verão','Outono','Inverno','Primavera')),
  occasion varchar(20) NOT NULL CHECK (occasion IN ('Casual','Trabalho','Faculdade','Festa','Passeio','Especial')),
  style varchar(50) NOT NULL DEFAULT '',
  image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clothes_user_idx ON clothes(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS outfits (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(60) NOT NULL,
  occasion varchar(20) NOT NULL CHECK (occasion IN ('Casual','Trabalho','Faculdade','Festa','Passeio','Especial')),
  notes varchar(250) NOT NULL DEFAULT '',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outfits_user_idx ON outfits(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS outfit_items (
  outfit_id uuid NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  clothing_id uuid NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL,
  PRIMARY KEY (outfit_id,clothing_id)
);
