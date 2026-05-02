package port

import (
	"context"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/google/uuid"
)

type InvoiceRepository interface {
	Save(ctx context.Context, invoice *entity.Invoice) error
	FindByAccessKey(ctx context.Context, accessKey string) (*entity.Invoice, error)
}

type ErrInvoiceNotFound struct {
	AccessKey string
}

func (e *ErrInvoiceNotFound) Error() string {
	return "invoice not found: " + e.AccessKey
}

type ErrDuplicateInvoice struct {
	ID        uuid.UUID
	AccessKey string
}

func (e *ErrDuplicateInvoice) Error() string {
	return "invoice already exists: " + e.AccessKey
}
