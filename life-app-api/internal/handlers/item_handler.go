package handlers

import (
	"life_app_api/internal/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
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

type UpdateItemInput struct {
	Title                *string    `json:"title"`
	FolderID             *int       `json:"folder_id"`
	Description          *string    `json:"description"`
	Priority             *string    `json:"priority"`
	Completed            *bool      `json:"completed"`
	IsRecurring          *bool      `json:"is_recurring"`
	RecurrenceRule       *string    `json:"recurrence_rule"`
	RecurrenceRuleCustom *int       `json:"recurrence_rule_custom"`
	StartAt              *time.Time `json:"start_at"`
	EndAt                *time.Time `json:"end_at"`
	EmailReminder        *bool      `json:"email_reminder"`
}

func CreateItemHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

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
			Completed:            input.Completed,
			RecurrenceRule:       input.RecurrenceRule,
			RecurrenceRuleCustom: input.RecurrenceRuleCustom,
			StartAt:              input.StartAt,
			EndAt:                input.EndAt,
			EmailReminder:        input.EmailReminder,
		}, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

func GetAllItemsHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		items, err := repository.GetAllItems(pool, userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, items)
	}
}

func GetItemByIDHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
			return
		}

		item, err := repository.GetItemByID(pool, id, userID)

		if err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}

func GetItemsByDateHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		dateStr := c.Query("date")
		if dateStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Date query parameter is required"})
			return
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
			return
		}

		items, err := repository.GetItemsByDate(pool, date, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, items)
	}
}

func GetUpcomingItemsByDateAndTypeHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		dateStr := c.Query("date")
		if dateStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Date query parameter is required"})
			return
		}

		typeStr := c.Query("type")
		if typeStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Type query parameter is required"})
			return
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
			return
		}

		items, err := repository.GetUpcomingItemsByDateAndType(pool, date, typeStr, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, items)
	}
}

func UpdateItemHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
			return
		}

		var input UpdateItemInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		item, err := repository.UpdateItem(pool, id, repository.UpdateItemOptions{
			Title:                input.Title,
			FolderID:             input.FolderID,
			Description:          input.Description,
			Priority:             input.Priority,
			Completed:            input.Completed,
			IsRecurring:          input.IsRecurring,
			RecurrenceRule:       input.RecurrenceRule,
			RecurrenceRuleCustom: input.RecurrenceRuleCustom,
			StartAt:              input.StartAt,
			EndAt:                input.EndAt,
			EmailReminder:        input.EmailReminder,
		}, userID)
		if err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}

func DeleteItemHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		userID := userIDInterface.(string)

		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
			return
		}

		err = repository.DeleteItem(pool, id, userID)

		if err != nil {
			if err.Error() == "Item with id "+idStr+" not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
	}
}
