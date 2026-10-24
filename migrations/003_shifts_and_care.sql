ALTER TABLE ca_lam_viec ADD COLUMN trang_thai BOOLEAN NOT NULL DEFAULT TRUE;
-- Retain canceled shifts for history; only active shifts reserve staff time.
DO $$ DECLARE item RECORD; BEGIN
    FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='ca_lam_viec'::regclass AND contype='x'
    LOOP EXECUTE format('ALTER TABLE ca_lam_viec DROP CONSTRAINT %I',item.conname); END LOOP;
END $$;
ALTER TABLE ca_lam_viec ADD CONSTRAINT ex_ca_lam_viec_active EXCLUDE USING gist (
    ma_nhan_vien WITH =, tsrange((ngay+gio_bat_dau)::timestamp,(ngay+gio_ket_thuc)::timestamp) WITH &&
) WHERE (trang_thai=TRUE);
ALTER TABLE lich_hen ADD COLUMN yeu_cau_xu_ly TEXT;
CREATE TABLE nhat_ky_lich_hen (
    ma_nhat_ky INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen),
    ma_nguoi_thuc_hien INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    hanh_dong VARCHAR(50) NOT NULL,
    trang_thai_cu VARCHAR(20), trang_thai_moi VARCHAR(20),
    noi_dung TEXT NOT NULL,
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nhat_ky_lich ON nhat_ky_lich_hen(ma_lich_hen,ngay_tao);
