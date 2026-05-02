package config

import (
	"fmt"
	"os"
	"slices"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv           string
	Port             int
	DatabaseURL      string
	RabbitMQURL      string
	RabbitMQExchange string
	InternalToken    string
}

func Load() (*Config, error) {
	cfg := &Config{
		AppEnv:           getEnv("APP_ENV", "development"),
		Port:             8080,
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		RabbitMQURL:      os.Getenv("RABBITMQ_URL"),
		RabbitMQExchange: getEnv("RABBITMQ_EXCHANGE", "invoices"),
		InternalToken:    os.Getenv("INTERNAL_TOKEN"),
	}

	if raw := os.Getenv("PORT"); raw != "" {
		p, err := strconv.Atoi(raw)
		if err != nil || p < 1 || p > 65535 {
			return nil, fmt.Errorf("PORT must be an integer between 1 and 65535, got %q", raw)
		}
		cfg.Port = p
	}

	validEnvs := []string{"development", "production", "test"}
	if !slices.Contains(validEnvs, cfg.AppEnv) {
		return nil, fmt.Errorf("APP_ENV must be one of %s, got %q", strings.Join(validEnvs, ", "), cfg.AppEnv)
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.RabbitMQURL == "" {
		missing = append(missing, "RABBITMQ_URL")
	}
	if cfg.InternalToken == "" {
		missing = append(missing, "INTERNAL_TOKEN")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}


