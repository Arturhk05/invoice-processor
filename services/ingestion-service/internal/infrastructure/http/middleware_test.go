package http_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	apphttp "github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/http"
)

func okHandler(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func TestInternalTokenMiddleware_valid_token(t *testing.T) {
	mw := apphttp.InternalTokenMiddleware("secret-token")
	srv := mw(http.HandlerFunc(okHandler))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Internal-Token", "secret-token")
	w := httptest.NewRecorder()

	srv.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("want 200, got %d", w.Code)
	}
}

func TestInternalTokenMiddleware_missing_token(t *testing.T) {
	mw := apphttp.InternalTokenMiddleware("secret-token")
	srv := mw(http.HandlerFunc(okHandler))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	srv.ServeHTTP(w, r)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
}

func TestInternalTokenMiddleware_wrong_token(t *testing.T) {
	mw := apphttp.InternalTokenMiddleware("secret-token")
	srv := mw(http.HandlerFunc(okHandler))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Internal-Token", "wrong-token")
	w := httptest.NewRecorder()

	srv.ServeHTTP(w, r)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
}

func TestInternalTokenMiddleware_empty_token_header(t *testing.T) {
	mw := apphttp.InternalTokenMiddleware("secret-token")
	srv := mw(http.HandlerFunc(okHandler))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Internal-Token", "")
	w := httptest.NewRecorder()

	srv.ServeHTTP(w, r)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
}
