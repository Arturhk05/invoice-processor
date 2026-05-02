package integration_test

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/shopspring/decimal"
)

var (
	testPool     *pgxpool.Pool
	testAMQPConn *amqp.Connection
	testDBURL    string
	testAMQPURL  string
	testToken    = "integration-test-token-abcdef123456"
)

func TestMain(m *testing.M) {
	testDBURL = os.Getenv("DATABASE_URL")
	testAMQPURL = os.Getenv("RABBITMQ_URL")

	if testDBURL == "" || testAMQPURL == "" {
		fmt.Println("integration: DATABASE_URL or RABBITMQ_URL not set — skipping")
		os.Exit(0)
	}

	ctx := context.Background()

	var err error
	testPool, err = pgxpool.New(ctx, testDBURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: postgres pool: %v\n", err)
		os.Exit(1)
	}
	defer testPool.Close()

	testAMQPConn, err = amqp.Dial(testAMQPURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: rabbitmq dial: %v\n", err)
		os.Exit(1)
	}
	defer testAMQPConn.Close()

	// declare test exchange so server tests can publish without "NOT_FOUND" errors
	amqpCh, err := testAMQPConn.Channel()
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: open channel: %v\n", err)
		os.Exit(1)
	}
	if err := amqpCh.ExchangeDeclare("invoices-integration-test", "topic", false, true, false, false, nil); err != nil {
		fmt.Fprintf(os.Stderr, "integration: declare exchange: %v\n", err)
		os.Exit(1)
	}
	amqpCh.Close()

	mg, err := migrate.New("file://../../migrations", testDBURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: migrate new: %v\n", err)
		os.Exit(1)
	}
	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		fmt.Fprintf(os.Stderr, "integration: migrate up: %v\n", err)
		os.Exit(1)
	}

	os.Exit(m.Run())
}

func truncateInvoices(t *testing.T) {
	t.Helper()
	_, err := testPool.Exec(context.Background(), "TRUNCATE TABLE invoices")
	if err != nil {
		t.Fatalf("truncate invoices: %v", err)
	}
}

func makeTestInvoice() *entity.Invoice {
	ak, _ := valueobject.NewAccessKey("35240112345678000195550010000001231000001230")
	issuer, _ := valueobject.NewCNPJ("12345678000195")
	recipient, _ := valueobject.NewCNPJ("98765432000100")
	return entity.NewInvoice(ak, issuer, recipient, time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC), decimal.NewFromFloat(1500.50))
}
