ALTER TABLE hoa_don DROP CONSTRAINT hoa_don_trang_thai_check;
ALTER TABLE hoa_don ADD CONSTRAINT hoa_don_trang_thai_check CHECK (
    trang_thai IN ('ChuaThanhToan','ThanhToanMotPhan','DaThanhToan','HoanTienMotPhan','DaHoanTien','DaHuy')
);
ALTER TABLE khieu_nai DROP CONSTRAINT khieu_nai_trang_thai_check;
ALTER TABLE khieu_nai ADD CONSTRAINT khieu_nai_trang_thai_check CHECK (trang_thai IN ('DaTiepNhan','ChoHoanTien','DaXuLy'));
ALTER TABLE khieu_nai ADD COLUMN quyet_dinh VARCHAR(20) CHECK (quyet_dinh IN ('TuChoi','KhacPhuc','HoanTien'));
ALTER TABLE khieu_nai ADD COLUMN nguoi_duyet INTEGER REFERENCES nguoi_dung(ma_nguoi_dung);
ALTER TABLE khieu_nai ADD COLUMN ngay_duyet TIMESTAMP;
ALTER TABLE khieu_nai ADD COLUMN nguoi_chi INTEGER REFERENCES nguoi_dung(ma_nguoi_dung);
ALTER TABLE khieu_nai ADD COLUMN ngay_chi TIMESTAMP;
ALTER TABLE khieu_nai ADD COLUMN bang_chung_chi VARCHAR(255);
ALTER TABLE khieu_nai ADD COLUMN loi_chi TEXT;
ALTER TABLE khieu_nai ADD CONSTRAINT chk_duyet_hoan CHECK (quyet_dinh IS DISTINCT FROM 'HoanTien' OR (ma_hoa_don IS NOT NULL AND so_tien_hoan>0));
ALTER TABLE thanh_toan ADD COLUMN ma_khieu_nai INTEGER REFERENCES khieu_nai(ma_khieu_nai);
CREATE UNIQUE INDEX ux_chi_hoan_thanh_cong ON thanh_toan(ma_khieu_nai) WHERE phuong_thuc='HoanTien' AND trang_thai='ThanhCong';

-- Reception actions may also be performed by an authorized Admin account.
ALTER TABLE khieu_nai DROP CONSTRAINT khieu_nai_nguoi_tiep_nhan_fkey;
ALTER TABLE khieu_nai ADD CONSTRAINT khieu_nai_nguoi_tiep_nhan_fkey FOREIGN KEY(nguoi_tiep_nhan) REFERENCES nguoi_dung(ma_nguoi_dung);
