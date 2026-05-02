package entity_test

import (
	"testing"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func makeInvoice(t *testing.T) *entity.Invoice {
	t.Helper()
	ak, _ := valueobject.NewAccessKey("35240112345678000195550010000001231000001230")
	issuer, _ := valueobject.NewCNPJ("12345678000195")
	recipient, _ := valueobject.NewCNPJ("98765432000100")
	return entity.NewInvoice(ak, issuer, recipient, time.Now(), decimal.NewFromFloat(1500.00))
}

func TestNewInvoice_sets_status_received(t *testing.T) {
	inv := makeInvoice(t)
	if inv.Status != entity.StatusReceived {
		t.Errorf("want status %q, got %q", entity.StatusReceived, inv.Status)
	}
}

func TestNewInvoice_generates_valid_uuid(t *testing.T) {
	inv := makeInvoice(t)
	if inv.ID == (uuid.UUID{}) {
		t.Fatal("expected non-zero UUID")
	}
	// uuid.New() always produces version 4
	if inv.ID.Version() != 4 {
		t.Errorf("expected UUID version 4, got %d", inv.ID.Version())
	}
}

func TestNewInvoice_unique_ids(t *testing.T) {
	a := makeInvoice(t)
	b := makeInvoice(t)
	if a.ID == b.ID {
		t.Error("two invoices should have different IDs")
	}
}

func TestNewInvoice_created_at_zero(t *testing.T) {
	inv := makeInvoice(t)
	if !inv.CreatedAt.IsZero() {
		t.Error("CreatedAt should be zero before DB persistence")
	}
}

func TestNewInvoice_stores_fields(t *testing.T) {
	ak, _ := valueobject.NewAccessKey("35240112345678000195550010000001231000001230")
	issuer, _ := valueobject.NewCNPJ("12345678000195")
	recipient, _ := valueobject.NewCNPJ("98765432000100")
	issuedAt := time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)

	amount := decimal.NewFromFloat(1500.50)
	inv := entity.NewInvoice(ak, issuer, recipient, issuedAt, amount)

	if inv.AccessKey != ak {
		t.Errorf("AccessKey: want %v, got %v", ak, inv.AccessKey)
	}
	if inv.IssuerCNPJ != issuer {
		t.Errorf("IssuerCNPJ: want %v, got %v", issuer, inv.IssuerCNPJ)
	}
	if inv.RecipientCNPJ != recipient {
		t.Errorf("RecipientCNPJ: want %v, got %v", recipient, inv.RecipientCNPJ)
	}
	if !inv.IssuedAt.Equal(issuedAt) {
		t.Errorf("IssuedAt: want %v, got %v", issuedAt, inv.IssuedAt)
	}
	if !inv.TotalAmount.Equal(amount) {
		t.Errorf("TotalAmount: want %v, got %v", amount, inv.TotalAmount)
	}
}
