-- Migration 001: Schema improvements to match design document
-- Run this after thu_cung.sql

-- 1. Allow NULL email in nguoi_dung (MH-01 treats email as optional)
ALTER TABLE nguoi_dung ALTER COLUMN email DROP NOT NULL;

-- 2. Add CHECK constraint for chuc_vu in nhan_vien
ALTER TABLE nhan_vien DROP CONSTRAINT IF EXISTS chk_nhan_vien_chuc_vu;
ALTER TABLE nhan_vien ADD CONSTRAINT chk_nhan_vien_chuc_vu
    CHECK (chuc_vu IN ('Lễ tân', 'Quản lý', 'Nhân viên chăm sóc'));

-- 3. Add "TuChoi" status to lich_hen (design doc §4.4.1 has "rejected")
ALTER TABLE lich_hen DROP CONSTRAINT IF EXISTS lich_hen_trang_thai_check;
ALTER TABLE lich_hen ADD CONSTRAINT lich_hen_trang_thai_check
    CHECK (trang_thai IN ('ChoXacNhan','DaXacNhan','DangThucHien','HoanThanh','DaHuy','TuChoi'));

-- 4. Add updated_at columns for audit trail (design doc convention)
ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE thu_cung ADD COLUMN IF NOT EXISTS ngay_tao TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE thu_cung ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE dich_vu ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE lich_hen ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW();

-- 5. Add vaccine tracking column to thu_cung (user-requested extension)
ALTER TABLE thu_cung ADD COLUMN IF NOT EXISTS ngay_vaccine_gan_nhat DATE;

-- 6. ========== CA_LAM_VIEC TABLE (missing from thu_cung.sql) ==========
CREATE TABLE IF NOT EXISTS ca_lam_viec (
    ma_ca_lam_viec    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_nhan_vien      INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    ngay              DATE NOT NULL,
    gio_bat_dau       TIME NOT NULL,
    gio_ket_thuc      TIME NOT NULL,
    vi_tri            VARCHAR(100),  -- user-requested extension: work location/station
    ghi_chu           VARCHAR(255),
    ngay_tao          TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (gio_ket_thuc > gio_bat_dau),
    CHECK (gio_bat_dau >= TIME '08:00' AND gio_ket_thuc <= TIME '19:00'),
    -- Prevent overlapping shifts for same staff on same day
    EXCLUDE USING gist (
        ma_nhan_vien WITH =,
        tsrange(
            (ngay + gio_bat_dau)::timestamp,
            (ngay + gio_ket_thuc)::timestamp
        ) WITH &&
    )
);

CREATE INDEX IF NOT EXISTS idx_ca_lam_viec_nhan_vien_ngay ON ca_lam_viec(ma_nhan_vien, ngay);

-- 7. ========== KHIEU_NAI TABLE (missing from thu_cung.sql) ==========
CREATE TABLE IF NOT EXISTS khieu_nai (
    ma_khieu_nai        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen         INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen),
    ma_hoa_don          INTEGER REFERENCES hoa_don(ma_hoa_don),
    noi_dung            TEXT NOT NULL,
    ket_qua_xu_ly       TEXT,
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'DaTiepNhan'
                        CHECK (trang_thai IN ('DaTiepNhan','DaXuLy')),
    nguoi_tiep_nhan     INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    nguoi_xu_ly         INTEGER REFERENCES nhan_vien(ma_nhan_vien),
    so_tien_hoan        NUMERIC(12,2) CHECK (so_tien_hoan >= 0),
    phuong_thuc_hoan    VARCHAR(20),
    ly_do_hoan          TEXT,
    ngay_tiep_nhan      TIMESTAMP NOT NULL DEFAULT NOW(),
    ngay_xu_ly          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_khieu_nai_lich_hen ON khieu_nai(ma_lich_hen);
CREATE INDEX IF NOT EXISTS idx_khieu_nai_trang_thai ON khieu_nai(trang_thai);

-- 8. ========== THONG_BAO TABLE (missing from thu_cung.sql) ==========
CREATE TABLE IF NOT EXISTS thong_bao (
    ma_thong_bao    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_nguoi_nhan   INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    ma_lich_hen     INTEGER REFERENCES lich_hen(ma_lich_hen),
    tieu_de         VARCHAR(150) NOT NULL,
    noi_dung        TEXT NOT NULL,
    da_doc          BOOLEAN NOT NULL DEFAULT FALSE,
    ngay_tao        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thong_bao_nguoi_nhan ON thong_bao(ma_nguoi_nhan, da_doc);
CREATE INDEX IF NOT EXISTS idx_thong_bao_lich_hen ON thong_bao(ma_lich_hen);

-- 9. Add refund payment method to thanh_toan
ALTER TABLE thanh_toan DROP CONSTRAINT IF EXISTS thanh_toan_phuong_thuc_check;
ALTER TABLE thanh_toan ADD CONSTRAINT thanh_toan_phuong_thuc_check
    CHECK (phuong_thuc IN ('TienMat','ChuyenKhoanQR','HoanTien'));

-- Migration complete
