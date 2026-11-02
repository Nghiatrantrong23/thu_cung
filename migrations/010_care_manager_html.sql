-- Care evidence and manager policies. Migration 009 provides richer pet profiles.
ALTER TABLE thu_cung ADD COLUMN dong_y_hien_anh BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE ghi_chu_ca_cham_soc (
    ma_ghi_chu INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen),
    ma_nhan_vien INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    noi_dung VARCHAR(500) NOT NULL CHECK (length(trim(noi_dung)) > 0),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ghi_chu_ca_cham_soc_lich ON ghi_chu_ca_cham_soc(ma_lich_hen,ma_ghi_chu);

CREATE TABLE su_co_cham_soc (
    ma_su_co INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen),
    ma_nguoi_bao INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    loai VARCHAR(40) NOT NULL CHECK (loai IN ('BiThuong','DauHieuBenh','HungDu','DiUng','Khac')),
    muc_do VARCHAR(12) NOT NULL CHECK (muc_do IN ('Thap','TrungBinh','Cao')),
    mo_ta VARCHAR(800) NOT NULL CHECK (length(trim(mo_ta)) > 0),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_su_co_cham_soc_lich ON su_co_cham_soc(ma_lich_hen,ma_su_co);

CREATE TABLE anh_cham_soc (
    ma_anh INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen),
    ma_su_co INTEGER REFERENCES su_co_cham_soc(ma_su_co),
    loai VARCHAR(8) NOT NULL CHECK (loai IN ('Truoc','Sau','SuCo')),
    mime VARCHAR(10) NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
    noi_dung BYTEA NOT NULL CHECK (octet_length(noi_dung) BETWEEN 1 AND 5242880),
    ma_nguoi_tao INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK ((loai='SuCo') = (ma_su_co IS NOT NULL))
);
CREATE INDEX idx_anh_cham_soc_lich ON anh_cham_soc(ma_lich_hen,loai,ma_anh);

CREATE TABLE nhan_vien_dich_vu (
    ma_nhan_vien INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    ma_dv INTEGER NOT NULL REFERENCES dich_vu(ma_dv),
    PRIMARY KEY(ma_nhan_vien,ma_dv)
);
ALTER TABLE nhan_vien ADD COLUMN ky_nang_da_cau_hinh BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE nghi_phep_nhan_vien (
    ma_nghi INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_nhan_vien INTEGER NOT NULL REFERENCES nhan_vien(ma_nhan_vien),
    tu_ngay DATE NOT NULL,
    den_ngay DATE NOT NULL,
    ma_nguoi_tao INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    trang_thai BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (den_ngay >= tu_ngay)
);
CREATE INDEX idx_nghi_phep_nhan_vien ON nghi_phep_nhan_vien(ma_nhan_vien,tu_ngay,den_ngay);

CREATE TABLE khuyen_mai (
    ma_khuyen_mai INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_code VARCHAR(12) NOT NULL UNIQUE CHECK (ma_code ~ '^[A-Z0-9]{4,12}$'),
    loai VARCHAR(8) NOT NULL CHECK (loai IN ('PhanTram','SoTien')),
    gia_tri NUMERIC(12,2) NOT NULL CHECK (gia_tri > 0),
    giam_toi_da NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (giam_toi_da >= 0),
    don_toi_thieu NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (don_toi_thieu >= 0),
    tu_ngay DATE NOT NULL,
    den_ngay DATE NOT NULL,
    tong_luot INTEGER NOT NULL CHECK (tong_luot > 0),
    moi_khach INTEGER NOT NULL CHECK (moi_khach > 0),
    dang_bat BOOLEAN NOT NULL DEFAULT TRUE,
    nguoi_tao INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (den_ngay >= tu_ngay),
    CHECK (loai='SoTien' OR gia_tri <= 100)
);
CREATE TABLE khuyen_mai_dich_vu (
    ma_khuyen_mai INTEGER NOT NULL REFERENCES khuyen_mai(ma_khuyen_mai),
    ma_dv INTEGER NOT NULL REFERENCES dich_vu(ma_dv),
    PRIMARY KEY(ma_khuyen_mai,ma_dv)
);
CREATE TABLE khuyen_mai_su_dung (
    ma_hoa_don INTEGER PRIMARY KEY REFERENCES hoa_don(ma_hoa_don),
    ma_khuyen_mai INTEGER NOT NULL REFERENCES khuyen_mai(ma_khuyen_mai),
    ma_khach_hang INTEGER NOT NULL REFERENCES khach_hang(ma_khach_hang),
    so_tien_giam NUMERIC(12,2) NOT NULL CHECK (so_tien_giam > 0),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_khuyen_mai_su_dung_khach ON khuyen_mai_su_dung(ma_khuyen_mai,ma_khach_hang);

CREATE TABLE hang_thanh_vien (
    ma_hang INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten VARCHAR(50) NOT NULL UNIQUE,
    nguong_chi_tieu NUMERIC(12,2) NOT NULL CHECK (nguong_chi_tieu >= 0),
    giam_gia NUMERIC(5,2) NOT NULL CHECK (giam_gia BETWEEN 0 AND 50),
    uu_tien BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO hang_thanh_vien(ten,nguong_chi_tieu,giam_gia,uu_tien) VALUES ('Thường',0,0,false),('Bạc',5000000,5,false),('Vàng',15000000,10,true);
CREATE TABLE cau_hinh_diem_thanh_vien (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
    dong_moi_diem INTEGER NOT NULL CHECK (dong_moi_diem >= 1000),
    han_thang INTEGER NOT NULL CHECK (han_thang BETWEEN 1 AND 120)
);
INSERT INTO cau_hinh_diem_thanh_vien(id,dong_moi_diem,han_thang) VALUES (TRUE,10000,12);
CREATE TABLE goi_tra_truoc (
    ma_goi INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_dv INTEGER NOT NULL REFERENCES dich_vu(ma_dv),
    so_lan INTEGER NOT NULL CHECK (so_lan >= 2),
    gia_goi NUMERIC(12,2) NOT NULL CHECK (gia_goi > 0),
    dang_ban BOOLEAN NOT NULL DEFAULT FALSE,
    nguoi_tao INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
