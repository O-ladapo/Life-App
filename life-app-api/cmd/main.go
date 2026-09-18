package main

import (
	"life_app_api/internal/auth"
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
			"message":  "life-app API is running!",
			"status":   "success",
			"database": "connected",
		})
	})

	router.POST("/auth/register", handlers.CreateUserHandler(pool))
	router.POST("/auth/login", handlers.LoginHandler(pool, cfg))

	protectedItem := router.Group("/items")
	protectedItem.Use(auth.AuthMiddleWare(cfg))
	protectedFolder := router.Group("/folders")
	protectedFolder.Use(auth.AuthMiddleWare(cfg))

	protectedItem.POST("", handlers.CreateItemHandler(pool))
	protectedItem.GET("", handlers.GetAllItemsHandler(pool))
	protectedItem.GET("/:id", handlers.GetItemByIDHandler(pool))
	protectedItem.PUT("/:id", handlers.UpdateItemHandler(pool))
	protectedItem.DELETE("/:id", handlers.DeleteItemHandler(pool))

	protectedFolder.POST("", handlers.CreateFolderHandler(pool))
	protectedFolder.GET("", handlers.GetAllFoldersHandler(pool))
	protectedFolder.GET("/:id", handlers.GetFolderByIDHandler(pool))
	protectedFolder.PUT("/:id", handlers.UpdateFolderHandler(pool))
	protectedFolder.DELETE("/:id", handlers.DeleteFolderHandler(pool))

	// Middleware test route
	router.GET("/protected-test", auth.AuthMiddleWare(cfg), handlers.TestProtectedHandler())

	router.Run(":" + cfg.Port)
}
