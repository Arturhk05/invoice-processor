package http

import (
	"fmt"
	"net/http"
)

func NewServer(port int, internalToken string, uc InvoiceIngestor) *http.Server {
	healthMux := http.NewServeMux()
	healthMux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	apiMux := http.NewServeMux()
	handler := NewInvoiceHandler(uc)
	apiMux.HandleFunc("POST /invoices", handler.Create)

	protected := InternalTokenMiddleware(internalToken)(apiMux)

	root := http.NewServeMux()
	root.Handle("/health", healthMux)
	root.Handle("/", protected)

	return &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: root,
	}
}
