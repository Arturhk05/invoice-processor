package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/usecase"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/shopspring/decimal"
)

type InvoiceIngestor interface {
	Execute(ctx context.Context, input usecase.IngestInvoiceInput) (*entity.Invoice, error)
}

type InvoiceHandler struct {
	uc InvoiceIngestor
}

func NewInvoiceHandler(uc InvoiceIngestor) *InvoiceHandler {
	return &InvoiceHandler{uc: uc}
}

type createInvoiceRequest struct {
	AccessKey     string          `json:"accessKey"`
	IssuerCNPJ    string          `json:"issuerCnpj"`
	RecipientCNPJ string          `json:"recipientCnpj"`
	IssuedAt      time.Time       `json:"issuedAt"`
	TotalAmount   decimal.Decimal `json:"totalAmount"`
}

type createInvoiceResponse struct {
	ID            string    `json:"id"`
	AccessKey     string    `json:"accessKey"`
	IssuerCNPJ    string    `json:"issuerCnpj"`
	RecipientCNPJ string    `json:"recipientCnpj"`
	IssuedAt      time.Time `json:"issuedAt"`
	TotalAmount   string    `json:"totalAmount"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
}

func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	input := usecase.IngestInvoiceInput{
		AccessKey:     req.AccessKey,
		IssuerCNPJ:    req.IssuerCNPJ,
		RecipientCNPJ: req.RecipientCNPJ,
		IssuedAt:      req.IssuedAt,
		TotalAmount:   req.TotalAmount,
	}

	invoice, err := h.uc.Execute(r.Context(), input)
	if err != nil {
		var dupErr *port.ErrDuplicateInvoice
		if errors.As(err, &dupErr) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "invoice already exists", "id": dupErr.ID.String()})
			return
		}
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, createInvoiceResponse{
		ID:            invoice.ID.String(),
		AccessKey:     string(invoice.AccessKey),
		IssuerCNPJ:    string(invoice.IssuerCNPJ),
		RecipientCNPJ: string(invoice.RecipientCNPJ),
		IssuedAt:      invoice.IssuedAt,
		TotalAmount:   invoice.TotalAmount.String(),
		Status:        string(invoice.Status),
		CreatedAt:     invoice.CreatedAt,
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
