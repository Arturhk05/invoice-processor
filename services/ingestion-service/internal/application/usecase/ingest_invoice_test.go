package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/port"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/usecase"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/domain/entity"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type mockRepo struct {
	findResult *entity.Invoice
	findErr    error
	saveErr    error
	saveCalled bool
}

func (m *mockRepo) FindByAccessKey(_ context.Context, _ string) (*entity.Invoice, error) {
	return m.findResult, m.findErr
}

func (m *mockRepo) Save(_ context.Context, _ *entity.Invoice) error {
	m.saveCalled = true
	return m.saveErr
}

type mockPublisher struct {
	publishErr    error
	publishCalled bool
	published     *entity.Invoice
}

func (m *mockPublisher) PublishInvoiceReceived(_ context.Context, inv *entity.Invoice) error {
	m.publishCalled = true
	m.published = inv
	return m.publishErr
}

func validInput() usecase.IngestInvoiceInput {
	return usecase.IngestInvoiceInput{
		AccessKey:     "35240112345678000195550010000001231000001230",
		IssuerCNPJ:    "12345678000195",
		RecipientCNPJ: "98765432000100",
		IssuedAt:      time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC),
		TotalAmount:   decimal.NewFromFloat(1500.50),
	}
}

func TestIngestInvoice_Execute_success(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	inv, err := uc.Execute(context.Background(), validInput())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if inv == nil {
		t.Fatal("expected invoice, got nil")
	}
	if inv.ID == (uuid.UUID{}) {
		t.Error("expected non-zero UUID")
	}
	if inv.Status != entity.StatusReceived {
		t.Errorf("want status %q, got %q", entity.StatusReceived, inv.Status)
	}
	if !repo.saveCalled {
		t.Error("repo.Save not called")
	}
	if !pub.publishCalled {
		t.Error("publisher.PublishInvoiceReceived not called")
	}
}

func TestIngestInvoice_Execute_returns_invoice_with_correct_fields(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	input := validInput()
	inv, err := uc.Execute(context.Background(), input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if string(inv.AccessKey) != input.AccessKey {
		t.Errorf("AccessKey: want %q, got %q", input.AccessKey, inv.AccessKey)
	}
	if string(inv.IssuerCNPJ) != input.IssuerCNPJ {
		t.Errorf("IssuerCNPJ: want %q, got %q", input.IssuerCNPJ, inv.IssuerCNPJ)
	}
	if string(inv.RecipientCNPJ) != input.RecipientCNPJ {
		t.Errorf("RecipientCNPJ: want %q, got %q", input.RecipientCNPJ, inv.RecipientCNPJ)
	}
	if !inv.IssuedAt.Equal(input.IssuedAt) {
		t.Errorf("IssuedAt: want %v, got %v", input.IssuedAt, inv.IssuedAt)
	}
	if !inv.TotalAmount.Equal(input.TotalAmount) {
		t.Errorf("TotalAmount: want %v, got %v", input.TotalAmount, inv.TotalAmount)
	}
}

func TestIngestInvoice_Execute_publishes_same_invoice(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	inv, _ := uc.Execute(context.Background(), validInput())
	if pub.published == nil {
		t.Fatal("published invoice is nil")
	}
	if pub.published.ID != inv.ID {
		t.Error("published invoice differs from returned invoice")
	}
}

func TestIngestInvoice_Execute_duplicate_returns_ErrDuplicateInvoice(t *testing.T) {
	existing := &entity.Invoice{ID: uuid.New()}
	repo := &mockRepo{findResult: existing}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	_, err := uc.Execute(context.Background(), validInput())
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var dupErr *port.ErrDuplicateInvoice
	if !errors.As(err, &dupErr) {
		t.Errorf("want *port.ErrDuplicateInvoice, got %T: %v", err, err)
	}
	if dupErr.ID != existing.ID {
		t.Errorf("ErrDuplicateInvoice.ID: want %v, got %v", existing.ID, dupErr.ID)
	}
	if repo.saveCalled {
		t.Error("repo.Save must not be called on duplicate")
	}
	if pub.publishCalled {
		t.Error("publisher must not be called on duplicate")
	}
}

func TestIngestInvoice_Execute_invalid_access_key(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	input := validInput()
	input.AccessKey = "bad-key"

	_, err := uc.Execute(context.Background(), input)
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
	if repo.saveCalled {
		t.Error("repo.Save must not be called on invalid input")
	}
}

func TestIngestInvoice_Execute_invalid_issuer_cnpj(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	input := validInput()
	input.IssuerCNPJ = "123"

	_, err := uc.Execute(context.Background(), input)
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestIngestInvoice_Execute_invalid_recipient_cnpj(t *testing.T) {
	repo := &mockRepo{}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	input := validInput()
	input.RecipientCNPJ = "abc"

	_, err := uc.Execute(context.Background(), input)
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestIngestInvoice_Execute_repo_find_error_propagates(t *testing.T) {
	repoErr := errors.New("db connection lost")
	repo := &mockRepo{findErr: repoErr}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	_, err := uc.Execute(context.Background(), validInput())
	if !errors.Is(err, repoErr) {
		t.Errorf("want repo find error, got %v", err)
	}
	if repo.saveCalled {
		t.Error("repo.Save must not be called when FindByAccessKey fails")
	}
}

func TestIngestInvoice_Execute_repo_save_error_propagates(t *testing.T) {
	saveErr := errors.New("constraint violation")
	repo := &mockRepo{saveErr: saveErr}
	pub := &mockPublisher{}
	uc := usecase.NewIngestInvoice(repo, pub)

	_, err := uc.Execute(context.Background(), validInput())
	if !errors.Is(err, saveErr) {
		t.Errorf("want repo save error, got %v", err)
	}
	if pub.publishCalled {
		t.Error("publisher must not be called when Save fails")
	}
}

func TestIngestInvoice_Execute_publish_error_propagates(t *testing.T) {
	pubErr := errors.New("rabbitmq unreachable")
	repo := &mockRepo{}
	pub := &mockPublisher{publishErr: pubErr}
	uc := usecase.NewIngestInvoice(repo, pub)

	_, err := uc.Execute(context.Background(), validInput())
	if !errors.Is(err, pubErr) {
		t.Errorf("want publish error, got %v", err)
	}
}
