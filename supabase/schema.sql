CREATE TABLE public.users (
  id bigserial PRIMARY KEY,
  telegram_id bigint UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('foreman','worker')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.projects (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  description text,
  created_by bigint REFERENCES public.users(id) ON DELETE SET NULL,
  invite_code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_projects (
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  project_id bigint REFERENCES public.projects(id) ON DELETE CASCADE,
  role text CHECK (role IN ('foreman','worker')) NOT NULL,
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE public.time_logs (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  project_id bigint REFERENCES public.projects(id) ON DELETE CASCADE,
  check_in timestamptz NOT NULL,
  check_out timestamptz,
  check_in_location point,
  check_out_location point,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.expenses (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  project_id bigint REFERENCES public.projects(id) ON DELETE CASCADE,
  amount numeric(12,2),
  comment text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.hidden_works (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  project_id bigint REFERENCES public.projects(id) ON DELETE CASCADE,
  stage text,
  comment text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);
