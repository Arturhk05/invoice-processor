package valueobject_test

import (
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
)

const validCNPJ = "12345678000195"

func TestNewCNPJ_valid(t *testing.T) {
	c, err := valueobject.NewCNPJ(validCNPJ)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.String() != validCNPJ {
		t.Errorf("want %q, got %q", validCNPJ, c.String())
	}
}

func TestNewCNPJ_too_short(t *testing.T) {
	_, err := valueobject.NewCNPJ("1234")
	if err == nil {
		t.Fatal("expected error for short CNPJ")
	}
}

func TestNewCNPJ_too_long(t *testing.T) {
	_, err := valueobject.NewCNPJ(validCNPJ + "0")
	if err == nil {
		t.Fatal("expected error for long CNPJ")
	}
}

func TestNewCNPJ_non_digits(t *testing.T) {
	_, err := valueobject.NewCNPJ("1234567800019X")
	if err == nil {
		t.Fatal("expected error for non-digit characters")
	}
}

func TestNewCNPJ_empty(t *testing.T) {
	_, err := valueobject.NewCNPJ("")
	if err == nil {
		t.Fatal("expected error for empty string")
	}
}
