ALTER TABLE hoa_don ADD COLUMN nguoi_lap INTEGER REFERENCES nguoi_dung(ma_nguoi_dung);
ALTER TABLE thanh_toan ADD COLUMN nguoi_ghi_nhan INTEGER REFERENCES nguoi_dung(ma_nguoi_dung);
ALTER TABLE thanh_toan ADD COLUMN khoa_chong_lap VARCHAR(100) UNIQUE;
ALTER TABLE thanh_toan ADD COLUMN tien_khach_dua NUMERIC(12,2);
ALTER TABLE thanh_toan ADD COLUMN tien_thua NUMERIC(12,2);
ALTER TABLE thanh_toan ADD CONSTRAINT chk_tien_mat_thua CHECK (
    (tien_khach_dua IS NULL AND tien_thua IS NULL) OR
    (phuong_thuc='TienMat' AND tien_khach_dua>=so_tien AND tien_thua=tien_khach_dua-so_tien)
);
CREATE INDEX idx_thanh_toan_ngay ON thanh_toan(ngay_thanh_toan);
