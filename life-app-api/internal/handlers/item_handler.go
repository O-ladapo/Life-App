package handlers

import (
	"life_app_api/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateItemInput struct {
	Title                string     `json:"title" binding:"required"`
	Type                 string     `json:"type" binding:"required"`
	FolderID             *int       `json:"folder_id"`
	Description          *string    `json:"description"`
	Priority             *string    `json:"priority"`
	Completed            bool       `json:"completed"`
	IsRecurring          bool       `json:"is_recurring"`
	RecurrenceRule       *string    `json:"recurrence_rule"`
	RecurrenceRuleCustom *int       `json:"recurrence_rule_custom"`
	StartAt              *time.Time `json:"start_at"`
	EndAt                *time.Time `json:"end_at"`
	EmailReminder        bool       `json:"email_reminder"`
}

func CreateItemHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input CreateItemInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		priority := "none"
		if input.Priority != nil {
			priority = *input.Priority
		}

		item, err := repository.CreateItem(pool, input.Title, input.Type, repository.CreateItemOptions{
			FolderID:             input.FolderID,
			Description:          input.Description,
			Priority:             priority,
			IsRecurring:          input.IsRecurring,
			RecurrenceRule:       input.RecurrenceRule,
			RecurrenceRuleCustom: input.RecurrenceRuleCustom,
			StartAt:              input.StartAt,
			EndAt:                input.EndAt,
			EmailReminder:        input.EmailReminder,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}
