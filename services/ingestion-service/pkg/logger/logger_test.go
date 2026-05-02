package logger_test

import (
	"context"
	"testing"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/pkg/logger"
	"go.uber.org/zap"
)

func TestNew_development(t *testing.T) {
	l, err := logger.New("development")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if l == nil {
		t.Fatal("expected non-nil logger")
	}
}

func TestNew_production(t *testing.T) {
	l, err := logger.New("production")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if l == nil {
		t.Fatal("expected non-nil logger")
	}
}

func TestNew_test_env(t *testing.T) {
	l, err := logger.New("test")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if l == nil {
		t.Fatal("expected non-nil logger")
	}
}

func TestFromContext_no_logger_returns_nop(t *testing.T) {
	l := logger.FromContext(context.Background())
	if l == nil {
		t.Fatal("expected non-nil logger, got nil")
	}
	// nop logger is a valid *zap.Logger — verify it doesn't panic on use
	l.Info("nop should not panic")
}

func TestFromContext_returns_stored_logger(t *testing.T) {
	original, _ := logger.New("development")
	ctx := logger.WithContext(context.Background(), original)

	retrieved := logger.FromContext(ctx)
	if retrieved != original {
		t.Fatal("expected the same logger instance stored in context")
	}
}

func TestWithContext_does_not_mutate_parent(t *testing.T) {
	parent := context.Background()
	l, _ := logger.New("development")

	child := logger.WithContext(parent, l)

	if logger.FromContext(parent) == l {
		t.Fatal("parent context should not be affected by WithContext")
	}
	if logger.FromContext(child) != l {
		t.Fatal("child context should carry the logger")
	}
}

func TestFromContext_nil_logger_stored_returns_nop(t *testing.T) {
	ctx := logger.WithContext(context.Background(), (*zap.Logger)(nil))
	l := logger.FromContext(ctx)
	if l == nil {
		t.Fatal("expected nop logger, got nil")
	}
	l.Info("should not panic")
}
