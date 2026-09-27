package repository

import (
	"context"
	"life_app_api/internal/models"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func GetAllUserIDsInEmailReminders(pool *pgxpool.Pool) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
	SELECT DISTINCT user_id FROM email_reminders`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []string

	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return userIDs, nil
}

func GetAllEmailRemindersByUserID(pool *pgxpool.Pool, userID string) (string, []models.Item, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Gets all reminders associated with the user_id
	rows, err := pool.Query(ctx, `
		SELECT id, user_id, reminder_id, sent_at, is_recurring
		FROM email_reminders
		WHERE user_id = $1`, userID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()

	reminders := make([]models.Item, 0)

	for rows.Next() {
		var email_reminder models.EmailReminder

		if err := rows.Scan(
			&email_reminder.ID,
			&email_reminder.UserID,
			&email_reminder.ReminderID,
			&email_reminder.SentAt,
			&email_reminder.IsRecurring,
		); err != nil {
			return "", nil, err
		}
		defer rows.Close()

		// Get specific reminder
		var reminder models.Item

		err := pool.QueryRow(ctx, `
			SELECT id, folder_id, title, type, description, priority, completed, is_recurring, recurrence_rule, recurrence_rule_custom, start_at, end_at, email_reminder, created_at, user_id
			FROM items
			WHERE user_id = $1
			AND id = $2`,email_reminder.UserID, email_reminder.ReminderID).Scan(
			&reminder.ID,
			&reminder.FolderID,
			&reminder.Title,
			&reminder.Type,
			&reminder.Description,
			&reminder.Priority,
			&reminder.Completed,
			&reminder.IsRecurring,
			&reminder.RecurrenceRule,
			&reminder.RecurrenceRuleCustom,
			&reminder.StartAt,
			&reminder.EndAt,
			&reminder.EmailReminder,
			&reminder.CreatedAt,
			&reminder.UserID,
		)
		if err != nil {
			return "", nil, err
		}
		defer rows.Close()

		dateStr := time.Now().UTC()
		currentDay := time.Date(dateStr.Year(), dateStr.Month(), dateStr.Day(), 0, 0, 0, 0, time.UTC)
		startDay := time.Date(reminder.StartAt.Year(), reminder.StartAt.Month(), reminder.StartAt.Day(), 0, 0, 0, 0, time.UTC)

		if email_reminder.IsRecurring {
			result := CheckRecurringDateByReminder(reminder, currentDay, startDay)
			if !result {
				continue
			}
		} else {
			if !(startDay.Equal(currentDay)) {
				continue
			}
		}
		reminders = append(reminders, reminder)
	}

	email, err := GetEmailByID(pool, userID)
	if err != nil{
		return "", nil, err
	}

	return email, reminders, nil
}

func StoreSentAtTimestamp(pool *pgxpool.Pool, reminders []models.Item) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := pool.Begin(ctx)
	if err != nil {
	    return err
	}
	defer tx.Rollback(ctx)
	
	dateStr := time.Now().UTC()
	for _, reminder := range reminders {
		_, err := tx.Exec(ctx, `
		UPDATE email_reminders
		SET sent_at = $1
		WHERE reminder_id = $2`, dateStr, reminder.ID)

		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}