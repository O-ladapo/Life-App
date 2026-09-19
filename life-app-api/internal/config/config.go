package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL  string
	Port         string
	JWTSecret    string
	ResendAPIKey string
}

func Load() (*Config, error) {
	var err error = godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found")
	}

	var config *Config = &Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		Port:         os.Getenv("PORT"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
	}

	return config, err
}
