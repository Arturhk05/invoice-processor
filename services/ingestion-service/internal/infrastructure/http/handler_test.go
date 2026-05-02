package http_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/usecase"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/valueobject"
	apphttp "github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/http"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type mockIngestor struct {
	result *entity.Invoice
	err    error
}

func (m *mockIngestor) Execute(_ context.Context, _ usecase.IngestInvoiceInput) (*entity.Invoice, error) {
	return m.result, m.err
}

func makeInvoice() *entity.Invoice {
	ak, _ := valueobject.NewAccessKey("35240112345678000195550010000001231000001230")
	issuer, _ := valueobject.NewCNPJ("12345678000195")
	recipient, _ := valueobject.NewCNPJ("98765432000100")
	inv := entity.NewInvoice(ak, issuer, recipient, time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC), decimal.NewFromFloat(1500.50))
	inv.CreatedAt = time.Now().UTC()
	return inv
}

const validBody = `{
	"accessKey":     "35240112345678000195550010000001231000001230",
	"issuerCnpj":    "12345678000195",
	"recipientCnpj": "98765432000100",
	"issuedAt":      "2024-01-15T10:30:00Z",
	"totalAmount":   1500.50
}`

func postCreate(handler *apphttp.InvoiceHandler, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodPost, "/invoices", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.Create(w, r)
	return w
}

func TestInvoiceHandler_Create_success(t *testing.T) {
	inv := makeInvoice()
	h := apphttp.NewInvoiceHandler(&mockIngestor{result: inv})

	w := postCreate(h, validBody)

	if w.Code != http.StatusCreated {
		t.Errorf("want 201, got %d — body: %s", w.Code, w.Body.String())
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("want Content-Type application/json, got %q", ct)
	}
}

func TestInvoiceHandler_Create_invalid_json(t *testing.T) {
	h := apphttp.NewInvoiceHandler(&mockIngestor{})

	w := postCreate(h, `{bad json}`)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestInvoiceHandler_Create_duplicate_returns_409(t *testing.T) {
	dupErr := &port.ErrDuplicateInvoice{ID: uuid.New(), AccessKey: "35240112345678000195550010000001231000001230"}
	h := apphttp.NewInvoiceHandler(&mockIngestor{err: dupErr})

	w := postCreate(h, validBody)

	if w.Code != http.StatusConflict {
		t.Errorf("want 409, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestInvoiceHandler_Create_validation_error_returns_422(t *testing.T) {
	h := apphttp.NewInvoiceHandler(&mockIngestor{err: errors.New("invalid access key")})

	w := postCreate(h, validBody)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("want 422, got %d", w.Code)
	}
}

func TestInvoiceHandler_Create_response_contains_id(t *testing.T) {
	inv := makeInvoice()
	h := apphttp.NewInvoiceHandler(&mockIngestor{result: inv})

	w := postCreate(h, validBody)

	body := w.Body.String()
	if !strings.Contains(body, inv.ID.String()) {
		t.Errorf("response body missing invoice ID %s: %s", inv.ID, body)
	}
}
