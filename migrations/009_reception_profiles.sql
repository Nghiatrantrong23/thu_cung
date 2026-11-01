-- Standalone counter profiles. Existing login-capable users remain activated.
ALTER TABLE nguoi_dung ALTER COLUMN mat_khau_hash DROP NOT NULL;
ALTER TABLE nguoi_dung ADD COLUMN kich_hoat_dang_nhap BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE nguoi_dung ADD CONSTRAINT chk_kich_hoat_co_mat_khau
    CHECK (NOT kich_hoat_dang_nhap OR mat_khau_hash IS NOT NULL);

ALTER TABLE khach_hang ADD COLUMN nguoi_tao INTEGER REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL;
ALTER TABLE thu_cung ADD COLUMN nguoi_tao INTEGER REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL;
ALTER TABLE thu_cung ADD COLUMN trang_thai_tiem_phong VARCHAR(12) NOT NULL DEFAULT 'ChuaRo'
    CHECK (trang_thai_tiem_phong IN ('ChuaRo','DaTiem','ChuaTiem'));
ALTER TABLE thu_cung ADD COLUMN di_ung VARCHAR(500);
ALTER TABLE thu_cung ADD COLUMN tinh_cach VARCHAR(500);

CREATE TABLE nhat_ky_ho_so (
    ma_nhat_ky INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    loai_doi_tuong VARCHAR(12) NOT NULL CHECK (loai_doi_tuong IN ('KhachHang','ThuCung')),
    ma_doi_tuong INTEGER NOT NULL,
    hanh_dong VARCHAR(20) NOT NULL CHECK (hanh_dong IN ('Tao','CapNhat')),
    ma_nguoi_thuc_hien INTEGER REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
    ngay_tao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nhat_ky_ho_so_doi_tuong ON nhat_ky_ho_so(loai_doi_tuong, ma_doi_tuong, ngay_tao);
