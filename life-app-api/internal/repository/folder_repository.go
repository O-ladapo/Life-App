package repository

import (
	"context"
	"fmt"
	"life_app_api/internal/models"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func CreateFolder(pool *pgxpool.Pool, title string, itemType string, userID string) (*models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var folder models.Folder
	err := pool.QueryRow(ctx, `
		INSERT INTO folders (title, type, user_id)
		VALUES ($1, $2, $3)
		RETURNING id, title, type, created_at, user_id`,
		title, itemType, userID).Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt, &folder.UserID)

	if err != nil {
		return nil, err
	}

	return &folder, nil
}

func GetAllFolders(pool *pgxpool.Pool, userID string) ([]models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT id, title, type, created_at, user_id
		FROM folders
		WHERE user_id = $1
		ORDER BY created_at`, userID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var folders []models.Folder = []models.Folder{}
	for rows.Next() {
		var folder models.Folder

		err = rows.Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt, &folder.UserID)

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

func GetFolderByID(pool *pgxpool.Pool, id int, userID string) (*models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var folder models.Folder
	err := pool.QueryRow(ctx, `
		SELECT id, title, type, created_at, user_id
		FROM folders
		WHERE id = $1 AND user_id = $2`, id, userID).Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt, &folder.UserID)
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func UpdateFolder(pool *pgxpool.Pool, id int, title string, userID string) (*models.Folder, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var folder models.Folder

	err := pool.QueryRow(ctx, `
	UPDATE folders
	SET title = $1
	WHERE id = $2 AND user_id = $3
	RETURNING id, title, type, created_at, user_id`, title, id, userID).Scan(&folder.ID, &folder.Title, &folder.Type, &folder.CreatedAt, &folder.UserID)
	if err != nil {
		return nil, err
	}

	return &folder, nil
}

func DeleteFolder(pool *pgxpool.Pool, id int, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	commandTag, err := pool.Exec(ctx, `
	DELETE FROM folders
	WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("Folder with id %d not found", id)
	}
	return nil
}
