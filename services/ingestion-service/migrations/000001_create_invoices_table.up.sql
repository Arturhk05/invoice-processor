CREATE TABLE IF NOT EXISTS invoices (
    id             UUID        PRIMARY KEY,
    access_key     CHAR(44)    NOT NULL UNIQUE,
    issuer_cnpj    CHAR(14)    NOT NULL,
    recipient_cnpj CHAR(14)    NOT NULL,
    issued_at      TIMESTAMPTZ NOT NULL,
    total_amount   NUMERIC(15, 2) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'received',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_access_key ON invoices (access_key);
CREATE INDEX IF NOT EXISTS idx_invoices_issuer_cnpj ON invoices (issuer_cnpj);