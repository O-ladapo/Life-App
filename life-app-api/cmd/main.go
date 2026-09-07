package main

import (
	"life_app_api/internal/config"
	"life_app_api/internal/database"
	"life_app_api/internal/handlers"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	defer pool.Close()

	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "life-app API is running!",
			"status":  "success",
			"database": "connected",
		})
	})

	router.POST("/items", handlers.CreateItemHandler(pool))
	router.POST("/folders", handlers.CreateFolderHandler(pool))
	router.GET("/items", handlers.GetAllItemsHandler(pool))
	router.GET("/items/:id",handlers.GetItemByIDHandler(pool))
	router.GET("/folders", handlers.GetAllFoldersHandler(pool))
	router.GET("/folders/:id", handlers.GetFolderByIDHandler(pool))

	router.Run(":" + cfg.Port)
}
