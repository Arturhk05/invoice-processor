package postgres

import (
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
)

var _ port.InvoiceRepository = (*InvoiceRepository)(nil)
