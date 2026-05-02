package http

import (
	"fmt"
	"net/http"
)

func NewServer(port int, internalToken string, uc InvoiceIngestor) *http.Server {
	mux := http.NewServeMux()

	handler := NewInvoiceHandler(uc)
	mux.HandleFunc("POST /invoices", handler.Create)

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: InternalTokenMiddleware(internalToken)(mux),
	}
}
