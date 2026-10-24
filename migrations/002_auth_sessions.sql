-- Existing accounts remain usable. Incrementing token_version revokes older sessions.
ALTER TABLE nguoi_dung ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0 CHECK (token_version >= 0);
ALTER TABLE nguoi_dung ADD COLUMN bat_doi_mat_khau BOOLEAN NOT NULL DEFAULT FALSE;
