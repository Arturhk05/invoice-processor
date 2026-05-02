package config_test

import (
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/config"
)

func withEnv(t *testing.T, pairs ...string) {
	t.Helper()
	for i := 0; i < len(pairs); i += 2 {
		t.Setenv(pairs[i], pairs[i+1])
	}
}

func validEnv(t *testing.T) {
	t.Helper()
	withEnv(t,
		"DATABASE_URL", "postgres://user:pass@localhost/db",
		"RABBITMQ_URL", "amqp://guest:guest@localhost:5672",
	)
}

func TestLoad_defaults(t *testing.T) {
	validEnv(t)

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.AppEnv != "development" {
		t.Errorf("AppEnv: want development, got %q", cfg.AppEnv)
	}
	if cfg.Port != 8080 {
		t.Errorf("Port: want 8080, got %d", cfg.Port)
	}
	if cfg.RabbitMQExchange != "invoices" {
		t.Errorf("RabbitMQExchange: want invoices, got %q", cfg.RabbitMQExchange)
	}
}

func TestLoad_reads_all_vars(t *testing.T) {
	withEnv(t,
		"APP_ENV", "production",
		"PORT", "9090",
		"DATABASE_URL", "postgres://user:pass@db:5432/mydb",
		"RABBITMQ_URL", "amqp://user:pass@broker:5672",
		"RABBITMQ_EXCHANGE", "fiscal-events",
	)

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.AppEnv != "production" {
		t.Errorf("AppEnv: want production, got %q", cfg.AppEnv)
	}
	if cfg.Port != 9090 {
		t.Errorf("Port: want 9090, got %d", cfg.Port)
	}
	if cfg.DatabaseURL != "postgres://user:pass@db:5432/mydb" {
		t.Errorf("DatabaseURL: unexpected value %q", cfg.DatabaseURL)
	}
	if cfg.RabbitMQURL != "amqp://user:pass@broker:5672" {
		t.Errorf("RabbitMQURL: unexpected value %q", cfg.RabbitMQURL)
	}
	if cfg.RabbitMQExchange != "fiscal-events" {
		t.Errorf("RabbitMQExchange: want fiscal-events, got %q", cfg.RabbitMQExchange)
	}
}

func TestLoad_missing_database_url(t *testing.T) {
	withEnv(t, "RABBITMQ_URL", "amqp://guest:guest@localhost:5672")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for missing DATABASE_URL")
	}
}

func TestLoad_missing_rabbitmq_url(t *testing.T) {
	withEnv(t, "DATABASE_URL", "postgres://user:pass@localhost/db")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for missing RABBITMQ_URL")
	}
}

func TestLoad_missing_both_required(t *testing.T) {
	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error when both required vars are missing")
	}
}

func TestLoad_invalid_port(t *testing.T) {
	validEnv(t)
	withEnv(t, "PORT", "not-a-number")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for invalid PORT")
	}
}

func TestLoad_port_out_of_range(t *testing.T) {
	validEnv(t)
	withEnv(t, "PORT", "99999")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for PORT out of range")
	}
}

func TestLoad_invalid_app_env(t *testing.T) {
	validEnv(t)
	withEnv(t, "APP_ENV", "staging")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for invalid APP_ENV")
	}
}
