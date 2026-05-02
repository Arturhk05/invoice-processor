package postgres

import (
	"context"
	"errors"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceRepository struct {
	pool *pgxpool.Pool
}

func NewInvoiceRepository(pool *pgxpool.Pool) *InvoiceRepository {
	return &InvoiceRepository{pool: pool}
}

func (r *InvoiceRepository) Save(ctx context.Context, invoice *entity.Invoice) error {
	const q = `
		INSERT INTO invoices (id, access_key, issuer_cnpj, recipient_cnpj, issued_at, total_amount, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`

	return r.pool.QueryRow(ctx, q,
		invoice.ID,
		string(invoice.AccessKey),
		string(invoice.IssuerCNPJ),
		string(invoice.RecipientCNPJ),
		invoice.IssuedAt,
		invoice.TotalAmount,
		string(invoice.Status),
	).Scan(&invoice.CreatedAt)
}

func (r *InvoiceRepository) FindByAccessKey(ctx context.Context, accessKey string) (*entity.Invoice, error) {
	const q = `
		SELECT id, access_key, issuer_cnpj, recipient_cnpj, issued_at, total_amount, status, created_at
		FROM invoices
		WHERE access_key = $1`

	row := r.pool.QueryRow(ctx, q, accessKey)

	var inv entity.Invoice
	var ak, issuer, recipient, status string

	err := row.Scan(
		&inv.ID,
		&ak,
		&issuer,
		&recipient,
		&inv.IssuedAt,
		&inv.TotalAmount,
		&status,
		&inv.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	inv.AccessKey = valueobject.AccessKey(ak)
	inv.IssuerCNPJ = valueobject.CNPJ(issuer)
	inv.RecipientCNPJ = valueobject.CNPJ(recipient)
	inv.Status = entity.Status(status)

	return &inv, nil
}
