package handlers

import (
	"life_app_api/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateFolderInput struct {
	Title                string     `json:"title" binding:"required"`
	Type                 string     `json:"type" binding:"required"`
}

func CreateFolderHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input CreateFolderInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		folder, err := repository.CreateFolder(pool, input.Title, input.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, folder)
	}
}
