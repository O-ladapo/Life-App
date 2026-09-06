package models

import "time"

type Folder struct {
	ID        int       `json:"id" db:"id"`
	Title     string    `json:"title" db:"title"`
	Type      string    `json:"type" db:"type"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
