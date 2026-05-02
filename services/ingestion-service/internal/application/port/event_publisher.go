package port

import (
	"context"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
)

type EventPublisher interface {
	PublishInvoiceReceived(ctx context.Context, invoice *entity.Invoice) error
}
