package integration_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/rabbitmq"
)

func TestPublisher_PublishInvoiceReceived_message_in_queue(t *testing.T) {
	exchange := "invoices-integration-test"
	queue := "invoices-integration-test-queue"

	ch, err := testAMQPConn.Channel()
	if err != nil {
		t.Fatalf("open channel: %v", err)
	}
	defer ch.Close()

	if err := ch.ExchangeDeclare(exchange, "topic", false, true, false, false, nil); err != nil {
		t.Fatalf("declare exchange: %v", err)
	}
	// exclusive=true avoids the deprecated transient_nonexcl_queues feature in RabbitMQ 4
	q, err := ch.QueueDeclare(queue, false, false, true, false, nil)
	if err != nil {
		t.Fatalf("declare queue: %v", err)
	}
	if err := ch.QueueBind(q.Name, "invoice.received", exchange, false, nil); err != nil {
		t.Fatalf("bind queue: %v", err)
	}

	pub := rabbitmq.NewPublisher(testAMQPConn, exchange)
	inv := makeTestInvoice()

	if err := pub.PublishInvoiceReceived(context.Background(), inv); err != nil {
		t.Fatalf("PublishInvoiceReceived: %v", err)
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		t.Fatalf("consume: %v", err)
	}

	select {
	case msg := <-msgs:
		var payload map[string]any
		if err := json.Unmarshal(msg.Body, &payload); err != nil {
			t.Fatalf("unmarshal message: %v", err)
		}
		if payload["id"] != inv.ID.String() {
			t.Errorf("message id: want %v, got %v", inv.ID, payload["id"])
		}
		if payload["accessKey"] != string(inv.AccessKey) {
			t.Errorf("message accessKey: want %v, got %v", inv.AccessKey, payload["accessKey"])
		}
		if payload["status"] != "received" {
			t.Errorf("message status: want received, got %v", payload["status"])
		}
	case <-time.After(3 * time.Second):
		t.Fatal("timeout waiting for message in queue")
	}
}
