package valueobject_test

import (
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
)

const validKey = "35240112345678000195550010000001231000001230"

func TestNewAccessKey_valid(t *testing.T) {
	ak, err := valueobject.NewAccessKey(validKey)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ak.String() != validKey {
		t.Errorf("want %q, got %q", validKey, ak.String())
	}
}

func TestNewAccessKey_too_short(t *testing.T) {
	_, err := valueobject.NewAccessKey("1234")
	if err == nil {
		t.Fatal("expected error for short key")
	}
}

func TestNewAccessKey_too_long(t *testing.T) {
	_, err := valueobject.NewAccessKey(validKey + "0")
	if err == nil {
		t.Fatal("expected error for long key")
	}
}

func TestNewAccessKey_non_digits(t *testing.T) {
	key := "ABCDE12345678000195550010000001231000001230"
	_, err := valueobject.NewAccessKey(key)
	if err == nil {
		t.Fatal("expected error for non-digit characters")
	}
}

func TestNewAccessKey_empty(t *testing.T) {
	_, err := valueobject.NewAccessKey("")
	if err == nil {
		t.Fatal("expected error for empty string")
	}
}
