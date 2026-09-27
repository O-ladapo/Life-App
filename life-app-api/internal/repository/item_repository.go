package repository

import (
	"context"
	"errors"
	"fmt"
	"life_app_api/internal/models"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
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

	tx, err := pool.Begin(ctx)
	if err != nil {
    	return nil, err
	}
	defer tx.Rollback(ctx)

	var item models.Item
	err = tx.QueryRow(ctx, `
		INSERT INTO items (folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id`,
		opts.FolderID, title, itemType, opts.Description, priority, opts.Completed, opts.IsRecurring, opts.RecurrenceRule, opts.RecurrenceRuleCustom, opts.StartAt, opts.EndAt, opts.EmailReminder, userID,
	).Scan(&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority, &item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom, &item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID)
	if err != nil {
		return nil, err
	}

	if opts.EmailReminder {
		_, err = tx.Exec(ctx, `
		INSERT INTO email_reminders (user_id, reminder_id, is_recurring)
		VALUES ($1, $2, $3)`, userID, item.ID, opts.IsRecurring)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil{
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

	// Gets items for the current date
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

	if rows.Err() != nil {
		return nil, rows.Err()
	}

	// Gets items that are recurring on the current date
	rows, err = pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		AND start_at < $2
		AND start_at IS NOT NULL
		AND recurrence_rule IS NOT NULL
		AND folder_id IS NULL
		ORDER BY start_at`, userID, startUTC)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items, err = check_recurring(items, startUTC, rows)
	if err != nil {
		return nil, err
	}

	if rows.Err() != nil {
		return nil, rows.Err()
	}

	// Gets items that are within the current date
	rows, err = pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		AND start_at < $2
		AND start_at IS NOT NULL
		AND end_at >= $2
		AND folder_id IS NULL
		ORDER BY start_at`, userID, startUTC)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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

		exists := false

		for _, existingItem := range items{
			if existingItem.ID == item.ID {
				exists = true
				break
			}
		}
		if exists {
			continue
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func GetUpcomingItemsByDateAndType(pool *pgxpool.Pool, date time.Time, itemType string, userID string) ([]models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	upcomingStart := date.AddDate(0, 0, 1)

	// Gets all items that have a start date > current date 
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

	if rows.Err() != nil {
		return nil, rows.Err()
	}

	// Gets all tasks whose start date is < current date, but their end date > current date
	rows, err = pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		AND start_at < $2
		AND start_at IS NOT NULL
		AND end_at >= $3
		AND type = $4
		AND end_at IS NOT NULL
		AND folder_id IS NULL
		ORDER BY start_at`, userID, date, upcomingStart, itemType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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

		exists := false

		for _, existingItem := range items{
			if existingItem.ID == item.ID {
				exists = true
				break
			}
		}
		if exists {
			continue
		}

		items = append(items, item)
	}

	// Gets all items whose start date is <= current date, but they are recurring at future dates
	rows, err = pool.Query(ctx, `
		SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
		FROM items
		WHERE user_id = $1
		AND start_at <= $2
		AND start_at IS NOT NULL
		AND is_recurring = $3
		AND type = $4
		AND folder_id IS NULL
		ORDER BY start_at`, userID, date, true, itemType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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

		exists := false

		for _, existingItem := range items{
			if existingItem.ID == item.ID {
				exists = true
				break
			}
		}
		if exists {
			continue
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

	tx, err := pool.Begin(ctx)
	if err != nil {
    	return nil, err
	}
	defer tx.Rollback(ctx)

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
		if !*opts.IsRecurring {
			_, err := tx.Exec(ctx, `
			UPDATE email_reminders 
			SET is_recurring = $3
			WHERE user_id = $1 AND reminder_id = $2`, userID, id, *opts.IsRecurring)
			if err != nil {
				return nil, err
			}
			addClause("recurrence_rule", nil)
			addClause("recurrence_rule_custom", nil)
		} else {
			if opts.RecurrenceRule != nil {
				addClause("recurrence_rule", *opts.RecurrenceRule)
			}
			if opts.RecurrenceRuleCustom != nil {
				addClause("recurrence_rule_custom", *opts.RecurrenceRuleCustom)
			}
		}
		_, err := tx.Exec(ctx, `
			UPDATE email_reminders 
			SET is_recurring = $3
			WHERE user_id = $1 AND reminder_id = $2`, userID, id, *opts.IsRecurring)
			if err != nil {
				return nil, err
			}
		addClause("is_recurring", *opts.IsRecurring)
	}
	if opts.StartAt != nil {
		addClause("start_at", *opts.StartAt)
	}
	if opts.EndAt != nil {
		addClause("end_at", *opts.EndAt)
	}
	if opts.EmailReminder != nil {
		if *opts.EmailReminder {
			_, err := tx.Exec(ctx, `
			INSERT INTO email_reminders (user_id, reminder_id, is_recurring)
			VALUES ($1, $2, $3)`, userID, id, *opts.IsRecurring)
			if err != nil {
				return nil, err
			}
		} else {
			_, err := tx.Exec(ctx, `
			DELETE FROM email_reminders
			WHERE reminder_id = $1 AND user_id = $2`, id, userID)
			if err != nil {
				return nil, err
			}
		}
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
	err = tx.QueryRow(ctx, query, args...).Scan(
		&item.ID, &item.FolderID, &item.Title, &item.Type, &item.Description, &item.Priority,
		&item.Completed, &item.IsRecurring, &item.RecurrenceRule, &item.RecurrenceRuleCustom,
		&item.StartAt, &item.EndAt, &item.EmailReminder, &item.CreatedAt, &item.UserID,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil{
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

func check_recurring(items []models.Item, currentDate time.Time, rows pgx.Rows) ([]models.Item, error) {
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

		switch *item.RecurrenceRule {
		case "daily":
			items = append(items, item)
		case "weekly":
			if item.StartAt.Weekday() == currentDate.Weekday() {
				items = append(items, item)
			}
		case "monthly":
			if item.StartAt.Day() == currentDate.Day() {
				items = append(items, item)
			}
			lastDayOfCurrentMonth := time.Date(currentDate.Year(), currentDate.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
			if item.StartAt.Day() > lastDayOfCurrentMonth && currentDate.Day() == lastDayOfCurrentMonth {
				items = append(items, item)
			}
			continue
		case "yearly":
			if (item.StartAt.Day() == currentDate.Day()) && (item.StartAt.Month() == currentDate.Month()) {
				items = append(items, item)
			}
		case "custom":
			if item.RecurrenceRuleCustom == nil || *item.RecurrenceRuleCustom <= 0 {
				continue
			}
			currentDay := time.Date(currentDate.Year(), currentDate.Month(), currentDate.Day(), 0, 0, 0, 0, time.UTC)
			startDay := time.Date(item.StartAt.Year(), item.StartAt.Month(), item.StartAt.Day(), 0, 0, 0, 0, time.UTC)
			daysSince := int(currentDay.Sub(startDay) / (24 * time.Hour))
			if daysSince >= 0 && daysSince%*item.RecurrenceRuleCustom == 0 {
				items = append(items, item)
			}
		}
	}
	return items, nil
}

func CheckRecurringDateByReminder(reminder models.Item, currentDay time.Time, startDay time.Time) bool {

	if currentDay.Before(startDay) {
		return false
	}

	switch *reminder.RecurrenceRule {
	case "daily":
		return true

	case "weekly":
		return startDay.Weekday() == currentDay.Weekday()

	case "monthly":
		if startDay.Day() == currentDay.Day() {
			return true
		}
		lastDayOfCurrentMonth := time.Date(currentDay.Year(), currentDay.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
		if startDay.Day() > lastDayOfCurrentMonth && currentDay.Day() == lastDayOfCurrentMonth {
			return true
		}
		return false

	case "yearly":
		return startDay.Day() == currentDay.Day() && startDay.Month() == currentDay.Month()

	case "custom":
		if reminder.RecurrenceRuleCustom == nil || *reminder.RecurrenceRuleCustom <= 0 {
			return false
		}
		daysSince := int(currentDay.Sub(startDay) / (24 * time.Hour))
		return daysSince%*reminder.RecurrenceRuleCustom == 0

	default:
		return false
	}
}
