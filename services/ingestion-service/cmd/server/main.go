package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/application/usecase"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/config"
	apphttp "github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/http"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/postgres"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/internal/infrastructure/rabbitmq"
	"github.com/Arturhk05/invoice-processor/services/ingestion-service/pkg/logger"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		panic("config: " + err.Error())
	}

	log, err := logger.New(cfg.AppEnv)
	if err != nil {
		panic("logger: " + err.Error())
	}
	defer log.Sync()

	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal("postgres: failed to create pool", zap.Error(err))
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("postgres: ping failed", zap.Error(err))
	}

	mg, err := migrate.New("file://migrations", cfg.DatabaseURL)
	if err != nil {
		log.Fatal("migrations: init failed", zap.Error(err))
	}
	if err := mg.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatal("migrations: up failed", zap.Error(err))
	}
	log.Info("migrations applied")

	amqpConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatal("rabbitmq: failed to connect", zap.Error(err))
	}
	defer amqpConn.Close()

	repo := postgres.NewInvoiceRepository(pool)
	pub := rabbitmq.NewPublisher(amqpConn, cfg.RabbitMQExchange)
	uc := usecase.NewIngestInvoice(repo, pub)
	srv := apphttp.NewServer(cfg.Port, cfg.InternalToken, uc)

	log.Info("starting ingestion service", zap.Int("port", cfg.Port), zap.String("env", cfg.AppEnv))

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("server error", zap.Error(err))
		}
	}()

	<-quit
	log.Info("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("shutdown error", zap.Error(err))
	}

	log.Info("stopped")
}
