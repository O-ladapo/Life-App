package handlers

import (
	"life_app_api/internal/config"
	"life_app_api/internal/models"
	"life_app_api/internal/repository"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func CreateUserHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var registerRequest RegisterRequest

		if err := c.BindJSON(&registerRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hasedPassword, err := bcrypt.GenerateFromPassword([]byte(registerRequest.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password " + err.Error()})
			return
		}

		user := &models.User{
			Username: registerRequest.Username,
			Email:    registerRequest.Email,
			Password: string(hasedPassword),
		}

		createdUser, err := repository.CreateUser(pool, user)
		if err != nil {
			if strings.Contains(err.Error(), "username") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Username is already registered"})
				return
			}

			if strings.Contains(err.Error(), "email") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Email is already registered"})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, createdUser)
	}
}

func LoginHandler(pool *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var loginRequest LoginRequest

		if err := c.BindJSON(&loginRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := repository.GetUserByUsername(pool, loginRequest.Username)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		claims := jwt.MapClaims{
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
			"exp":      time.Now().Add(24 * time.Hour).Unix(),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

		tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokem " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, LoginResponse{Token: tokenString})
	}
}

func TestProtectedHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")

		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Protected route accessed successfully!",
			"user_id": userID,
		})
	}
}