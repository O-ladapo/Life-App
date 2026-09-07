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

func GetAllFolders(pool *pgxpool.Pool) ([]models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT id, title, type, created_at
		FROM folders
		ORDER BY created_at`)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var folders []models.Folder = []models.Folder{}
	for rows.Next() {
		var folder models.Folder

		err = rows.Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt)

		if err != nil {
			return nil, err
		}

		folders = append(folders, folder)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return folders, nil
}

func GetFolderByID(pool *pgxpool.Pool, id int) (*models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var folder models.Folder
	err := pool.QueryRow(ctx, `
		SELECT id, title, type, created_at
		FROM folders
		WHERE id = $1`, id).Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &folder, nil
}