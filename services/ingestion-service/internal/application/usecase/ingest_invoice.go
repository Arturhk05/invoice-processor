package usecase

import (
	"context"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	"github.com/shopspring/decimal"
)

type IngestInvoiceInput struct {
	AccessKey     string
	IssuerCNPJ    string
	RecipientCNPJ string
	IssuedAt      time.Time
	TotalAmount   decimal.Decimal
}

type IngestInvoice struct {
	repo      port.InvoiceRepository
	publisher port.EventPublisher
}

func NewIngestInvoice(repo port.InvoiceRepository, publisher port.EventPublisher) *IngestInvoice {
	return &IngestInvoice{repo: repo, publisher: publisher}
}

func (uc *IngestInvoice) Execute(ctx context.Context, input IngestInvoiceInput) (*entity.Invoice, error) {
	accessKey, err := valueobject.NewAccessKey(input.AccessKey)
	if err != nil {
		return nil, err
	}

	issuerCNPJ, err := valueobject.NewCNPJ(input.IssuerCNPJ)
	if err != nil {
		return nil, err
	}

	recipientCNPJ, err := valueobject.NewCNPJ(input.RecipientCNPJ)
	if err != nil {
		return nil, err
	}

	existing, err := uc.repo.FindByAccessKey(ctx, input.AccessKey)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, &port.ErrDuplicateInvoice{
			ID:        existing.ID,
			AccessKey: input.AccessKey,
		}
	}

	invoice := entity.NewInvoice(accessKey, issuerCNPJ, recipientCNPJ, input.IssuedAt, input.TotalAmount)

	if err := uc.repo.Save(ctx, invoice); err != nil {
		return nil, err
	}

	if err := uc.publisher.PublishInvoiceReceived(ctx, invoice); err != nil {
		return nil, err
	}

	return invoice, nil
}
