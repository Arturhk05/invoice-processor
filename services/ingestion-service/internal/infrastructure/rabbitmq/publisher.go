package rabbitmq

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	amqp "github.com/rabbitmq/amqp091-go"
)

var _ port.EventPublisher = (*Publisher)(nil)

type Publisher struct {
	conn     *amqp.Connection
	exchange string
}

func NewPublisher(conn *amqp.Connection, exchange string) *Publisher {
	return &Publisher{conn: conn, exchange: exchange}
}

type invoiceReceivedEvent struct {
	ID            string    `json:"id"`
	AccessKey     string    `json:"accessKey"`
	IssuerCNPJ    string    `json:"issuerCnpj"`
	RecipientCNPJ string    `json:"recipientCnpj"`
	IssuedAt      time.Time `json:"issuedAt"`
	TotalAmount   string    `json:"totalAmount"`
	Status        string    `json:"status"`
	OccurredAt    time.Time `json:"occurredAt"`
}

func (p *Publisher) PublishInvoiceReceived(ctx context.Context, invoice *entity.Invoice) error {
	ch, err := p.conn.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	payload, err := json.Marshal(invoiceReceivedEvent{
		ID:            invoice.ID.String(),
		AccessKey:     string(invoice.AccessKey),
		IssuerCNPJ:    string(invoice.IssuerCNPJ),
		RecipientCNPJ: string(invoice.RecipientCNPJ),
		IssuedAt:      invoice.IssuedAt,
		TotalAmount:   invoice.TotalAmount.String(),
		Status:        string(invoice.Status),
		OccurredAt:    time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	return ch.PublishWithContext(ctx, p.exchange, "invoice.received", false, false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         payload,
		},
	)
}
