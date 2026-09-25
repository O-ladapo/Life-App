package repository

import (
	"context"
	"errors"
	"fmt"
	"life_app_api/internal/models"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateItemOptions struct {
	FolderID             *int
	Description          *string
	Priority             string
	Completed            bool
	IsRecurring          bool
	RecurrenceRule       *string
	RecurrenceRuleCustom *int
	StartAt              *time.Time
	EndAt                *time.Time
	EmailReminder        bool
}

type UpdateItemOptions struct {
	Title                *string
	FolderID             *int
	Description          *string
	Priority             *string
	Completed            *bool
	IsRecurring          *bool
	RecurrenceRule       *string
	RecurrenceRuleCustom *int
	StartAt              *time.Time
	EndAt                *time.Time
	EmailReminder        *bool
}

func CreateItem(pool *pgxpool.Pool, title string, itemType string, opts CreateItemOptions, userID string) (*models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	priority := opts.Priority
	if priority == "" {
		priority = "none"
	}

	var item models.Item
	err := pool.QueryRow(ctx, `
		INSERT INTO items (folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id`,
		opts.FolderID, title, itemType, opts.Description, priority, opts.Completed, opts.IsRecurring, opts.RecurrenceRule, opts.RecurrenceRuleCustom, opts.StartAt, opts.EndAt, opts.EmailReminder, userID,
	).Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func GetAllItems(pool *pgxpool.Pool, userID string) ([]models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		ORDER BY created_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item = []models.Item{}
	for rows.Next() {
		var item models.Item
		err = rows.Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed,
			&item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func GetItemByID(pool *pgxpool.Pool, id int, userID string) (*models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var item models.Item
	err := pool.QueryRow(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE id = $1 AND user_id = $2`, id, userID).Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed,
		&item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func GetItemsByDate(pool *pgxpool.Pool, startUTC time.Time, endUTC time.Time, userID string) ([]models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		AND start_at IS NOT NULL
		AND start_at >= $2
		AND start_at < $3
		AND folder_id IS NULL
		ORDER BY start_at`, userID, startUTC, endUTC)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Item, 0)
	for rows.Next() {
		var item models.Item

		if err := rows.Scan(
			&item.ID,
			&item.FolderID,
			&item.Title,
			&item.Type,
			&item.Description,
			&item.Priority,
			&item.Completed,
			&item.IsRecurring,
			&item.RecurrenceRule,
			&item.RecurrenceRuleCustom,
			&item.StartAt,
			&item.EndAt,
			&item.EmailReminder,
			&item.CreatedAt,
			&item.UserID,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func GetUpcomingItemsByDateAndType(pool *pgxpool.Pool, date time.Time, itemType string, userID string) ([]models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	upcomingStart := date.AddDate(0, 0, 1)

	rows, err := pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1 AND start_at >= $2 AND type = $3 AND folder_id IS NULL
		ORDER BY start_at`, userID, upcomingStart, itemType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Item, 0)

	for rows.Next() {
		var item models.Item

		if err := rows.Scan(
			&item.ID,
			&item.FolderID,
			&item.Title,
			&item.Type,
			&item.Description,
			&item.Priority,
			&item.Completed,
			&item.IsRecurring,
			&item.RecurrenceRule,
			&item.RecurrenceRuleCustom,
			&item.StartAt,
			&item.EndAt,
			&item.EmailReminder,
			&item.CreatedAt,
			&item.UserID,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func UpdateItem(pool *pgxpool.Pool, id int, opts UpdateItemOptions, userID string) (*models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	setClauses := []string{}
	args := []interface{}{}
	argPos := 1

	addClause := func(column string, value interface{}) {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", column, argPos))
		args = append(args, value)
		argPos++
	}

	if opts.Title != nil {
		addClause("title", *opts.Title)
	}
	if opts.FolderID != nil {
		addClause("folder_id", *opts.FolderID)
	}
	if opts.Description != nil {
		addClause("description", *opts.Description)
	}
	if opts.Priority != nil {
		addClause("priority", *opts.Priority)
	}
	if opts.Completed != nil {
		addClause("completed", *opts.Completed)
	}
	if opts.IsRecurring != nil {
		addClause("is_recurring", *opts.IsRecurring)
	}
	if opts.RecurrenceRule != nil {
		addClause("recurrence_rule", *opts.RecurrenceRule)
	}
	if opts.RecurrenceRuleCustom != nil {
		addClause("recurrence_rule_custom", *opts.RecurrenceRuleCustom)
	}
	if opts.StartAt != nil {
		addClause("start_at", *opts.StartAt)
	}
	if opts.EndAt != nil {
		addClause("end_at", *opts.EndAt)
	}
	if opts.EmailReminder != nil {
		addClause("email_reminder", *opts.EmailReminder)
	}

	if len(setClauses) == 0 {
		return nil, errors.New("No fields provided to update")
	}

	query := fmt.Sprintf(`
		UPDATE items
		SET %s
		WHERE id = $%d AND user_id = $%d
		RETURNING id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id`,
		strings.Join(setClauses, ", "), argPos, argPos+1)
	args = append(args, id, userID)

	var item models.Item
	err := pool.QueryRow(ctx, query, args...).Scan(
		&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority,
		&item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom,
		&item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID,
	)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func DeleteItem(pool *pgxpool.Pool, id int, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	commandTag, err := pool.Exec(ctx, `
	DELETE FROM items
	WHERE id = $1 AND user_id = $2`, id, userID)

	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("Item with id %d not found", id)
	}
	return nil
}
