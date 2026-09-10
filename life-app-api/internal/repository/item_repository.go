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

func CreateItem(pool *pgxpool.Pool, title string, itemType string, opts CreateItemOptions) (*models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	priority := opts.Priority
	if priority == "" {
		priority = "none"
	}

	var item models.Item
	err := pool.QueryRow(ctx, `
		INSERT INTO items (folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at`,
		opts.FolderID, title, itemType, opts.Description, priority, opts.Completed, opts.IsRecurring, opts.RecurrenceRule, opts.RecurrenceRuleCustom, opts.StartAt, opts.EndAt, opts.EmailReminder,
	).Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func GetAllItems(pool *pgxpool.Pool) ([]models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at
		FROM items
		ORDER BY created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item = []models.Item{}
	for rows.Next() {
		var item models.Item
		err = rows.Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed,
			&item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt)
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

func GetItemByID(pool *pgxpool.Pool, id int) (*models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var item models.Item
	err := pool.QueryRow(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at
		FROM items
		WHERE id = $1`, id).Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed,
		&item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func UpdateItem(pool *pgxpool.Pool, id int, opts UpdateItemOptions) (*models.Item, error) {
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
		WHERE id = $%d
		RETURNING id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at`,
		strings.Join(setClauses, ", "), argPos)
	args = append(args, id)

	var item models.Item
	err := pool.QueryRow(ctx, query, args...).Scan(
		&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority,
		&item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom,
		&item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func DeleteItem(pool *pgxpool.Pool, id int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	commandTag, err := pool.Exec(ctx, `
	DELETE FROM items
	WHERE id = $1`, id)

	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("Item with id %d not found", id)
	}
	return nil
}
