package repository

import (
	"context"
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
