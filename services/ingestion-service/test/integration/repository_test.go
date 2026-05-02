package integration_test

import (
	"context"
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/postgres"
)

func TestInvoiceRepository_Save_sets_created_at(t *testing.T) {
	truncateInvoices(t)
	repo := postgres.NewInvoiceRepository(testPool)
	inv := makeTestInvoice()

	if err := repo.Save(context.Background(), inv); err != nil {
		t.Fatalf("Save: %v", err)
	}
	if inv.CreatedAt.IsZero() {
		t.Error("CreatedAt should be set by RETURNING after Save")
	}
}

func TestInvoiceRepository_FindByAccessKey_returns_nil_when_not_found(t *testing.T) {
	truncateInvoices(t)
	repo := postgres.NewInvoiceRepository(testPool)

	found, err := repo.FindByAccessKey(context.Background(), "35240112345678000195550010000001231000001230")
	if err != nil {
		t.Fatalf("FindByAccessKey: %v", err)
	}
	if found != nil {
		t.Error("want nil, got invoice")
	}
}

func TestInvoiceRepository_FindByAccessKey_returns_saved_invoice(t *testing.T) {
	truncateInvoices(t)
	repo := postgres.NewInvoiceRepository(testPool)
	inv := makeTestInvoice()

	if err := repo.Save(context.Background(), inv); err != nil {
		t.Fatalf("Save: %v", err)
	}

	found, err := repo.FindByAccessKey(context.Background(), string(inv.AccessKey))
	if err != nil {
		t.Fatalf("FindByAccessKey: %v", err)
	}
	if found == nil {
		t.Fatal("want invoice, got nil")
	}
	if found.ID != inv.ID {
		t.Errorf("ID: want %v, got %v", inv.ID, found.ID)
	}
	if found.CreatedAt.IsZero() {
		t.Error("CreatedAt should be set on found invoice")
	}
	if string(found.AccessKey) != string(inv.AccessKey) {
		t.Errorf("AccessKey: want %v, got %v", inv.AccessKey, found.AccessKey)
	}
	if string(found.Status) != "received" {
		t.Errorf("Status: want received, got %v", found.Status)
	}
}

func TestInvoiceRepository_Save_duplicate_access_key_returns_error(t *testing.T) {
	truncateInvoices(t)
	repo := postgres.NewInvoiceRepository(testPool)

	inv1 := makeTestInvoice()
	if err := repo.Save(context.Background(), inv1); err != nil {
		t.Fatalf("first Save: %v", err)
	}

	inv2 := makeTestInvoice() // same access key, new UUID
	err := repo.Save(context.Background(), inv2)
	if err == nil {
		t.Fatal("expected unique constraint error, got nil")
	}
}
