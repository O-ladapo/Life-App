package models

import "time"

type User struct {
	ID                              string     `json:"id" db:"id"`
	Username                        string     `json:"username" db:"username"`
	Email                           string     `json:"email" db:"email"`
	Password                        string     `json:"-" db:"password"`
	Created_at                      time.Time  `json:"created_at" db:"created_at"`
	Email_verified                  bool       `json:"email_verified" db:"email_verified"`
	Verification_token              *string    `json:"verification_token" db:"verification_token"`
	Verification_token_expires_at   *time.Time `json:"verification_token_expires_at" db:"verification_token_expires_at"`
	Password_reset_token            *string    `json:"password_reset_token" db:"password_reset_token"`
	Password_reset_token_expires_at *time.Time `json:"password_reset_token_expires_at" db:"password_reset_token_expires_at"`
}
