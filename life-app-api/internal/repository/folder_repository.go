package repository

import (
	"context"
	"life_app_api/internal/models"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func CreateFolder(pool *pgxpool.Pool, title string, itemType string) (*models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var folder models.Folder
	err := pool.QueryRow(ctx, `
		INSERT INTO folders (title, type)
		VALUES ($1, $2)
		RETURNING id, title, type, created_at`, 
		title, itemType).Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt)

	if err != nil{
		return nil, err
	}

	return &folder, nil
}