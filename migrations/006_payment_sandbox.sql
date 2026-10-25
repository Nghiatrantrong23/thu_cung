-- Local payment sandbox only. Existing real transactions remain unchanged.
ALTER TABLE thanh_toan DROP CONSTRAINT thanh_toan_phuong_thuc_check;
ALTER TABLE thanh_toan ADD CONSTRAINT thanh_toan_phuong_thuc_check
    CHECK (phuong_thuc IN ('TienMat','ChuyenKhoanQR','MoMo','HoanTien'));

CREATE TABLE payment_intents (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES hoa_don(ma_hoa_don),
    created_by INTEGER NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    method VARCHAR(20) NOT NULL CHECK (method IN ('BankQR','MoMo','COD')),
    mode VARCHAR(10) NOT NULL DEFAULT 'sandbox' CHECK (mode='sandbox'),
    amount NUMERIC(12,2) NOT NULL CHECK (amount>0 AND amount=trunc(amount)),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending','AwaitingCash','Paid','Failed','Cancelled','Expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_id VARCHAR(100) UNIQUE,
    transaction_id INTEGER UNIQUE REFERENCES thanh_toan(ma_thanh_toan),
    settled_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX payment_intents_one_open ON payment_intents(invoice_id)
    WHERE status IN ('Pending','AwaitingCash');
