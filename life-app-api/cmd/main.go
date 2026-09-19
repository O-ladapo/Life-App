package main

import (
	"life_app_api/internal/auth"
	"life_app_api/internal/config"
	"life_app_api/internal/database"
	"life_app_api/internal/handlers"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
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

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	
	protectedAuth := router.Group("/auth")
	protectedAuth.Use(auth.AuthMiddleWare(cfg))

	protectedItem := router.Group("/items")
	protectedItem.Use(auth.AuthMiddleWare(cfg))

	protectedFolder := router.Group("/folders")
	protectedFolder.Use(auth.AuthMiddleWare(cfg))

	protectedAuth.POST("/register", handlers.CreateUserHandler(pool, cfg))
	protectedAuth.POST("/login", handlers.LoginHandler(pool, cfg))
	protectedAuth.POST("/password-reset", handlers.PasswordResetHandler(pool, cfg))
	protectedAuth.POST("/verify-password-reset", handlers.VerifyPasswordReset(pool, cfg))

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

	// test routes
	router.GET("/protected-test", auth.AuthMiddleWare(cfg), handlers.TestProtectedHandler())
	router.GET("/test-email", handlers.SendTestEmailHandler(cfg))

	router.Run(":" + cfg.Port)
}
