package models

import "time"

type EmailReminder struct {
	ID          int       `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	ReminderID  int       `json:"reminder_id" db:"reminder_id"`
	SentAt      *time.Time `json:"sent_at" db:"sent_at"`
	IsRecurring bool      `json:"is_recurring" db:"is_recurring"`
}
