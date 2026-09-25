package main

import (
	"life_app_api/internal/auth"
	"life_app_api/internal/config"
	"life_app_api/internal/database"
	"life_app_api/internal/handlers"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func runMigrations(databaseURL string) error {
	m, err := migrate.New("file://migrations", databaseURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil {
        if err == migrate.ErrNoChange {
            log.Println("No new migrations to apply")
            return nil
        }
        return err
    }
    log.Println("Migrations applied successfully")
    return nil
}

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

	if err := runMigrations(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to run migrations: ", err)
	}

	router := gin.Default()
	router.SetTrustedProxies(nil)

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "https://life-app-blue-five.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	protectedItem := router.Group("/items")
	protectedItem.Use(auth.AuthMiddleWare(cfg))

	protectedFolder := router.Group("/folders")
	protectedFolder.Use(auth.AuthMiddleWare(cfg))

	router.POST("/auth/register", handlers.CreateUserHandler(pool, cfg))
	router.POST("/auth/login", handlers.LoginHandler(pool, cfg))
	router.POST("/auth/password-reset", handlers.PasswordResetHandler(pool, cfg))
	router.POST("/auth/verify-password-reset", handlers.VerifyPasswordReset(pool, cfg))

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

	router.Run(":" + cfg.Port)
}
