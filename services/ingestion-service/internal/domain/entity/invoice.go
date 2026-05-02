package entity

import (
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Status string

const StatusReceived Status = "received"

type Invoice struct {
	ID            uuid.UUID
	AccessKey     valueobject.AccessKey
	IssuerCNPJ    valueobject.CNPJ
	RecipientCNPJ valueobject.CNPJ
	IssuedAt      time.Time
	TotalAmount   decimal.Decimal
	Status        Status
	CreatedAt     time.Time // set by PostgreSQL via RETURNING
}

func NewInvoice(
	accessKey valueobject.AccessKey,
	issuerCNPJ valueobject.CNPJ,
	recipientCNPJ valueobject.CNPJ,
	issuedAt time.Time,
	totalAmount decimal.Decimal,
) *Invoice {
	return &Invoice{
		ID:            uuid.New(),
		AccessKey:     accessKey,
		IssuerCNPJ:    issuerCNPJ,
		RecipientCNPJ: recipientCNPJ,
		IssuedAt:      issuedAt,
		TotalAmount:   totalAmount,
		Status:        StatusReceived,
	}
}
