package handlers

import (
	"life_app_api/internal/config"
	"life_app_api/internal/email"
	"life_app_api/internal/repository"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func SendDailyEmailReminders(pool *pgxpool.Pool, cfg *config.Config) error {
	userIDs, err := repository.GetAllUserIDsInEmailReminders(pool)
	if err != nil {
		return err
	}
	if len(userIDs) == 0 {
		log.Println("No users found with pending email reminders.")
		return nil
	}

	for _, id := range userIDs {
		userEmail, reminders, err := repository.GetAllEmailRemindersByUserID(pool, id)
		if err != nil {
			log.Println("Failed to send reminders email:", err)
			continue
		}
		if len(reminders) == 0 {
			continue
		}
		html := email.ReminderEmailHTML(cfg.FrontendURL, reminders)
		if err := email.SendEmail(cfg.ResendAPIKey, userEmail, "Your Reminders", html); err != nil {
			log.Println("Failed to send reminders email:", err)
			continue
		}
		if err := repository.StoreSentAtTimestamp(pool, reminders); err != nil{
			log.Println("Failed to store the sent_at timestamp:", err)
			continue
		}
	}
	return nil
}
