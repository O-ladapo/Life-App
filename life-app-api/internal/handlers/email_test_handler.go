// In a handler file, e.g. internal/handlers/email_test_handler.go
package handlers

import (
	"life_app_api/internal/config"
	"life_app_api/internal/email"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SendTestEmailHandler(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		html := email.VerificationEmailHTML("https://example.com/verify?token=test123")
		err := email.SendEmail(cfg.ResendAPIKey, "olaniran.da06@gmail.com", "Test verification email", html)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Email sent successfully"})
	}
}