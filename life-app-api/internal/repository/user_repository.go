package repository

import (
	"context"
	"errors"
	"fmt"
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
	RETURNING id, username, email, created_at, email_verified, verification_token, verification_token_expires_at, password_reset_token, password_reset_token_expires_at`, user.Username, user.Email, user.Password).Scan(
		&user.ID, &user.Username, &user.Email, &user.Created_at, &user.Email_verified, &user.Verification_token, &user.Verification_token_expires_at, &user.Password_reset_token, &user.Password_reset_token_expires_at)

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
	SELECT id, username, email, password, created_at, email_verified, verification_token, verification_token_expires_at, password_reset_token, password_reset_token_expires_at
	FROM users
	WHERE email = $1`, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at, &user.Email_verified, &user.Verification_token, &user.Verification_token_expires_at, &user.Password_reset_token, &user.Password_reset_token_expires_at)

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
	SELECT id, username, email, password, created_at, email_verified, verification_token, verification_token_expires_at, password_reset_token, password_reset_token_expires_at
	FROM users
	WHERE username = $1`, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at, &user.Email_verified, &user.Verification_token, &user.Verification_token_expires_at, &user.Password_reset_token, &user.Password_reset_token_expires_at)

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
	SELECT id, username, email, password, created_at, email_verified, verification_token, verification_token_expires_at, password_reset_token, password_reset_token_expires_at
	FROM users
	WHERE id = $1`, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Created_at, &user.Email_verified, &user.Verification_token, &user.Verification_token_expires_at, &user.Password_reset_token, &user.Password_reset_token_expires_at)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func DeleteUser(pool *pgxpool.Pool, id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	commandTag, err := pool.Exec(ctx, `
	DELETE FROM users
	WHERE id = $1`, id)

	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("User with id %v not found", id)
	}

	return nil
}

func SetPasswordResetToken(pool *pgxpool.Pool, userID string, token string, expiresAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := pool.Exec(ctx,
		`UPDATE users 
		SET password_reset_token = $1, password_reset_token_expires_at = $2 
		WHERE id = $3`,
		token, expiresAt, userID)
	return err
}

func VerifyPasswordResetToken(pool *pgxpool.Pool, token string, hashedPassword string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := pool.Exec(ctx, `
        UPDATE users 
        SET password = $2, password_reset_token = NULL, password_reset_token_expires_at = NULL
        WHERE password_reset_token = $1 AND password_reset_token_expires_at > NOW()`,
		token, hashedPassword)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("invalid or expired token")
	}

	return nil
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
