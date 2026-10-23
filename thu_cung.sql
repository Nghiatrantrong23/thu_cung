

-- Cần cho ràng buộc chống trùng lịch nhân viên
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ========== NGƯỜI DÙNG ==========
CREATE TABLE nguoi_dung (
    ma_nguoi_dung  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_dang_nhap  VARCHAR(50)  NOT NULL UNIQUE,
    mat_khau_hash  VARCHAR(255) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    so_dien_thoai  VARCHAR(15)  UNIQUE,
    vai_tro        VARCHAR(20)  NOT NULL
                   CHECK (vai_tro IN ('KhachHang','NhanVien','Admin')),
    trang_thai     BOOLEAN      NOT NULL DEFAULT TRUE,
    ngay_tao       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE khach_hang (
    ma_khach_hang  INTEGER PRIMARY KEY REFERENCES nguoi_dung(ma_nguoi_dung),
    ho_ten         VARCHAR(100) NOT NULL,
    dia_chi        VARCHAR(255),
    ghi_chu        VARCHAR(500)
);

CREATE TABLE nhan_vien (
    ma_nhan_vien   INTEGER PRIMARY KEY REFERENCES nguoi_dung(ma_nguoi_dung),
    ho_ten         VARCHAR(100) NOT NULL,
    chuc_vu        VARCHAR(50)  NOT NULL,   -- Lễ tân, Quản lý, Groomer, Bác sĩ...
    chuyen_mon     VARCHAR(100),
    ngay_vao_lam   DATE,
    trang_thai     BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========== THÚ CƯNG (chỉ chó và mèo) ==========
CREATE TABLE thu_cung (
    ma_thu_cung      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_khach_hang    INTEGER NOT NULL REFERENCES khach_hang(ma_khach_hang),
    ten_thu_cung     VARCHAR(50) NOT NULL,
    loai_thu_cung    VARCHAR(10) NOT NULL CHECK (loai_thu_cung IN ('Chó','Mèo')),
    giong            VARCHAR(50),
    gioi_tinh        VARCHAR(10) CHECK (gioi_tinh IN ('Đực','Cái')),
    ngay_sinh        DATE,
    can_nang         NUMERIC(5,2) CHECK (can_nang > 0),
    ghi_chu_suc_khoe VARCHAR(500),
    trang_thai       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========== DỊCH VỤ ==========
CREATE TABLE loai_dv (
    ma_loai_dv   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_loai_dv  VARCHAR(100) NOT NULL UNIQUE,
    mo_ta        VARCHAR(255)
);

CREATE TABLE dich_vu (
    ma_dv           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_loai_dv      INTEGER NOT NULL REFERENCES loai_dv(ma_loai_dv),
    ten_dv          VARCHAR(100) NOT NULL,
    mo_ta           VARCHAR(500),
    gia_hien_hanh   NUMERIC(12,2) NOT NULL CHECK (gia_hien_hanh >= 0),
    thoi_luong_phut INTEGER CHECK (thoi_luong_phut > 0),
    trang_thai      BOOLEAN NOT NULL DEFAULT TRUE   -- ngừng bán thì FALSE, không xóa
);

-- ========== LỊCH HẸN ==========
CREATE TABLE lich_hen (
    ma_lich_hen            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_thu_cung            INTEGER NOT NULL REFERENCES thu_cung(ma_thu_cung),
    ma_nhan_vien           INTEGER REFERENCES nhan_vien(ma_nhan_vien),  -- NULL nếu chưa phân công
    ngay_gio_hen           TIMESTAMP NOT NULL,
    ngay_gio_ket_thuc_du_kien TIMESTAMP,
    trang_thai             VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan'
                           CHECK (trang_thai IN ('ChoXacNhan','DaXacNhan','DangThucHien','HoanThanh','DaHuy')),
    ghi_chu                VARCHAR(500),   -- ghi cả lý do từ chối / hủy
    ngay_tao               TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (ngay_gio_ket_thuc_du_kien IS NULL OR ngay_gio_ket_thuc_du_kien > ngay_gio_hen),
    -- Một nhân viên không có hai lịch (chưa hủy) chồng giờ
    EXCLUDE USING gist (
        ma_nhan_vien WITH =,
        tsrange(ngay_gio_hen, ngay_gio_ket_thuc_du_kien) WITH &&
    ) WHERE (ma_nhan_vien IS NOT NULL
             AND ngay_gio_ket_thuc_du_kien IS NOT NULL
             AND trang_thai <> 'DaHuy')
);

CREATE TABLE chi_tiet_lich_hen (
    ma_chi_tiet_lich_hen INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen          INTEGER NOT NULL REFERENCES lich_hen(ma_lich_hen) ON DELETE CASCADE,
    ma_dv                INTEGER NOT NULL REFERENCES dich_vu(ma_dv),
    so_luong             INTEGER NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    gia_du_kien          NUMERIC(12,2) NOT NULL CHECK (gia_du_kien >= 0),
    trang_thai           VARCHAR(20) NOT NULL DEFAULT 'ChoThucHien'
                         CHECK (trang_thai IN ('ChoThucHien','DangThucHien','HoanThanh','DaHuy')),
    ghi_chu_cham_soc     VARCHAR(500),
    UNIQUE (ma_lich_hen, ma_dv)
);

-- ========== ĐÁNH GIÁ ==========
CREATE TABLE danh_gia (
    ma_danh_gia   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen   INTEGER NOT NULL UNIQUE REFERENCES lich_hen(ma_lich_hen),
    so_sao        INTEGER NOT NULL CHECK (so_sao BETWEEN 1 AND 5),
    nhan_xet      VARCHAR(500),
    ngay_danh_gia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== HÓA ĐƠN VÀ THANH TOÁN ==========
CREATE TABLE hoa_don (
    ma_hoa_don   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_lich_hen  INTEGER NOT NULL UNIQUE REFERENCES lich_hen(ma_lich_hen),
    ngay_lap     TIMESTAMP NOT NULL DEFAULT NOW(),
    tong_tien    NUMERIC(12,2) NOT NULL CHECK (tong_tien >= 0),
    giam_gia     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (giam_gia >= 0),
    thanh_tien   NUMERIC(12,2) NOT NULL,
    trang_thai   VARCHAR(20) NOT NULL DEFAULT 'ChuaThanhToan'
                 CHECK (trang_thai IN ('ChuaThanhToan','ThanhToanMotPhan','DaThanhToan','DaHoanTien','DaHuy')),
    ghi_chu      VARCHAR(255),
    CHECK (giam_gia <= tong_tien),
    CHECK (thanh_tien = tong_tien - giam_gia)
);

CREATE TABLE chi_tiet_hoa_don (
    ma_chi_tiet_hoa_don INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_hoa_don          INTEGER NOT NULL REFERENCES hoa_don(ma_hoa_don) ON DELETE CASCADE,
    ma_dv               INTEGER NOT NULL REFERENCES dich_vu(ma_dv),
    ten_dv_luu_lai      VARCHAR(100) NOT NULL,        -- snapshot tên dịch vụ
    so_luong            INTEGER NOT NULL CHECK (so_luong > 0),
    don_gia             NUMERIC(12,2) NOT NULL CHECK (don_gia >= 0),  -- snapshot giá
    thanh_tien          NUMERIC(12,2) NOT NULL,
    CHECK (thanh_tien = so_luong * don_gia)
);

CREATE TABLE thanh_toan (
    ma_thanh_toan     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_hoa_don        INTEGER NOT NULL REFERENCES hoa_don(ma_hoa_don),
    phuong_thuc       VARCHAR(20) NOT NULL CHECK (phuong_thuc IN ('TienMat','ChuyenKhoanQR')),
    so_tien           NUMERIC(12,2) NOT NULL CHECK (so_tien > 0),
    ngay_thanh_toan   TIMESTAMP NOT NULL DEFAULT NOW(),
    ma_giao_dich      VARCHAR(100),
    trang_thai        VARCHAR(20) NOT NULL CHECK (trang_thai IN ('ThanhCong','ThatBai','HoanTien')),
    ly_do_hoan_tien   VARCHAR(255)
);

-- ========== INDEX ==========
CREATE INDEX idx_thu_cung_khach_hang  ON thu_cung(ma_khach_hang);
CREATE INDEX idx_lich_hen_ngay_gio    ON lich_hen(ngay_gio_hen);
CREATE INDEX idx_lich_hen_nhan_vien   ON lich_hen(ma_nhan_vien, ngay_gio_hen);
CREATE INDEX idx_lich_hen_trang_thai  ON lich_hen(trang_thai);
CREATE INDEX idx_ctlh_lich_hen        ON chi_tiet_lich_hen(ma_lich_hen);
CREATE INDEX idx_cthd_hoa_don         ON chi_tiet_hoa_don(ma_hoa_don);
CREATE INDEX idx_thanh_toan_hoa_don   ON thanh_toan(ma_hoa_don);

ALTER TABLE lich_hen
ADD CONSTRAINT chk_gio_mo_cua CHECK (
    ngay_gio_hen::time >= TIME '08:00'
    AND (
        ngay_gio_ket_thuc_du_kien IS NULL
        OR (ngay_gio_ket_thuc_du_kien::time <= TIME '19:00'
            AND ngay_gio_ket_thuc_du_kien::date = ngay_gio_hen::date)
    )
);

ALTER TABLE hoa_don DROP CONSTRAINT IF EXISTS hoa_don_trang_thai_check;
ALTER TABLE hoa_don ADD CONSTRAINT hoa_don_trang_thai_check
    CHECK (trang_thai IN ('ChuaThanhToan','ThanhToanMotPhan','DaThanhToan','DaHoanTien','DaHuy'));

ALTER TABLE thanh_toan DROP CONSTRAINT IF EXISTS thanh_toan_trang_thai_check;
ALTER TABLE thanh_toan ADD CONSTRAINT thanh_toan_trang_thai_check
    CHECK (trang_thai IN ('ThanhCong','ThatBai','HoanTien'));

ALTER TABLE thanh_toan ADD COLUMN IF NOT EXISTS ly_do_hoan_tien VARCHAR(255);