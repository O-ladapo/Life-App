package repository

import (
	"context"
	"errors"
	"life_app_api/internal/models"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func CreateUser(pool *pgxpool.Pool, user *models.User) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := pool.QueryRow(ctx, `
	INSERT INTO users (username, email, password)
	VALUES ($1, $2, $3)
	RETURNING id, username, email, created_at`, user.Username, user.Email, user.Password).Scan(
		&user.ID, &user.Username, &user.Email, &user.Created_at)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func GetUserByEmail(pool *pgxpool.Pool, email string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User

	err := pool.QueryRow(ctx, `
	SELECT id, username, email, password, created_at
	FROM users
	WHERE email = $1`, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByUsername(pool *pgxpool.Pool, username string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User

	err := pool.QueryRow(ctx, `
	SELECT id, username, email, password, created_at
	FROM users
	WHERE username = $1`, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByID(pool *pgxpool.Pool, id string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User

	err := pool.QueryRow(ctx, `
	SELECT id, username, email, password, created_at
	FROM users
	WHERE id = $1`, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func SetVerificationToken(pool *pgxpool.Pool, userID string, token string, expiresAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := pool.Exec(ctx,
		`UPDATE users 
		SET verification_token = $1, verification_token_expires_at = $2 
		WHERE id = $3`,
		token, expiresAt, userID)
	return err
}

func VerifyUserByToken(pool *pgxpool.Pool, token string, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := pool.Exec(ctx, `
        UPDATE users 
        SET email_verified = true, verification_token = NULL, verification_token_expires_at = NULL
        WHERE verification_token = $1 AND id = $2 AND verification_token_expires_at > NOW()`,
		token, userID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("invalid or expired token")
	}

	return nil
}
