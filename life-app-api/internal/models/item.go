package models

import "time"

type Item struct {
	ID                   int        `json:"id" db:"id"`
	FolderID             *int       `json:"folder_id" db:"folder_id"`
	Title                string     `json:"title" db:"title"`
	Type                 string     `json:"type" db:"type"`
	Description          *string    `json:"description" db:"description"`
	Priority             string     `json:"priority" db:"priority"`
	Completed            bool       `json:"completed" db:"completed"`
	IsRecurring          bool       `json:"is_recurring" db:"is_recurring"`
	RecurrenceRule       *string    `json:"recurrence_rule" db:"recurrence_rule"`
	RecurrenceRuleCustom *int       `json:"recurrence_rule_custom" db:"recurrence_rule_custom"`
	StartAt              *time.Time `json:"start_at" db:"start_at"`
	EndAt                *time.Time `json:"end_at" db:"end_at"`
	EmailReminder        bool       `json:"email_reminder" db:"email_reminder"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
}
