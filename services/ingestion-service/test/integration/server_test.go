package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/usecase"
	apphttp "github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/http"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/postgres"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/rabbitmq"
)

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	repo := postgres.NewInvoiceRepository(testPool)
	pub := rabbitmq.NewPublisher(testAMQPConn, "invoices-integration-test")
	uc := usecase.NewIngestInvoice(repo, pub)
	srv := apphttp.NewServer(0, testToken, uc)
	return httptest.NewServer(srv.Handler)
}

const validPayload = `{
	"accessKey":     "35240112345678000195550010000001231000001230",
	"issuerCnpj":    "12345678000195",
	"recipientCnpj": "98765432000100",
	"issuedAt":      "2024-01-15T10:30:00Z",
	"totalAmount":   1500.50
}`

func TestServer_Health_no_token_required(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	res, err := http.Get(srv.URL + "/health")
	if err != nil {
		t.Fatalf("GET /health: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Errorf("want 200, got %d", res.StatusCode)
	}
}

func TestServer_PostInvoices_without_token_returns_401(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	res, err := http.Post(srv.URL+"/invoices", "application/json", bytes.NewBufferString(validPayload))
	if err != nil {
		t.Fatalf("POST /invoices: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", res.StatusCode)
	}
}

func TestServer_PostInvoices_happy_path_returns_201(t *testing.T) {
	truncateInvoices(t)
	srv := newTestServer(t)
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodPost, srv.URL+"/invoices", bytes.NewBufferString(validPayload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", testToken)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST /invoices: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		t.Errorf("want 201, got %d", res.StatusCode)
	}

	var body map[string]any
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["id"] == "" || body["id"] == nil {
		t.Error("response missing id")
	}
	if body["status"] != "received" {
		t.Errorf("status: want received, got %v", body["status"])
	}
}

func TestServer_PostInvoices_duplicate_returns_409(t *testing.T) {
	truncateInvoices(t)
	srv := newTestServer(t)
	defer srv.Close()

	doPost := func() *http.Response {
		req, _ := http.NewRequest(http.MethodPost, srv.URL+"/invoices", bytes.NewBufferString(validPayload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Internal-Token", testToken)
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("POST /invoices: %v", err)
		}
		return res
	}

	first := doPost()
	first.Body.Close()
	if first.StatusCode != http.StatusCreated {
		t.Fatalf("first request: want 201, got %d", first.StatusCode)
	}

	second := doPost()
	defer second.Body.Close()
	if second.StatusCode != http.StatusConflict {
		t.Errorf("second request (duplicate): want 409, got %d", second.StatusCode)
	}
}
