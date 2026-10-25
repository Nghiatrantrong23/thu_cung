-- New bookings opt into a versioned deposit policy; legacy bookings are unchanged.
CREATE TABLE booking_deposits (
    booking_id INTEGER PRIMARY KEY REFERENCES lich_hen(ma_lich_hen),
    policy_version VARCHAR(30) NOT NULL DEFAULT 'deposit-30-24h-v1',
    quoted_total NUMERIC(12,2) NOT NULL CHECK (quoted_total>0),
    amount NUMERIC(12,2) NOT NULL CHECK (amount>0 AND amount=trunc(amount)),
    status VARCHAR(20) NOT NULL DEFAULT 'Unpaid'
        CHECK (status IN ('Unpaid','Paid','Applied','RefundPending','Refunded','Forfeited','Cancelled')),
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    original_start TIMESTAMPTZ NOT NULL,
    late_reschedules INTEGER NOT NULL DEFAULT 0 CHECK (late_reschedules BETWEEN 0 AND 1),
    refund_locked BOOLEAN NOT NULL DEFAULT FALSE,
    decision_reason VARCHAR(500),
    decided_by INTEGER REFERENCES nguoi_dung(ma_nguoi_dung),
    decided_at TIMESTAMPTZ,
    invoice_id INTEGER UNIQUE REFERENCES hoa_don(ma_hoa_don)
);
CREATE TABLE deposit_transactions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking_deposits(booking_id),
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('Collect','Refund')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount>0),
    method VARCHAR(20) NOT NULL CHECK (method IN ('TienMat','ChuyenKhoanQR','MoMo')),
    reference VARCHAR(100),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    actor INTEGER REFERENCES nguoi_dung(ma_nguoi_dung),
    sandbox BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id,kind)
);
CREATE TABLE deposit_intents (
    id VARCHAR(36) PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking_deposits(booking_id),
    method VARCHAR(20) NOT NULL CHECK (method IN ('BankQR','MoMo')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount>0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Paid','Failed','Cancelled','Expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    event_id VARCHAR(100) UNIQUE,
    transaction_id INTEGER UNIQUE REFERENCES deposit_transactions(id)
);
CREATE UNIQUE INDEX deposit_intents_one_open ON deposit_intents(booking_id) WHERE status='Pending';
ALTER TABLE hoa_don ADD COLUMN deposit_credit NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (deposit_credit>=0 AND deposit_credit<=thanh_tien);
