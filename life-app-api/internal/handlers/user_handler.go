package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"life_app_api/internal/config"
	"life_app_api/internal/email"
	"life_app_api/internal/models"
	"life_app_api/internal/repository"
	"log"
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
	Token    string `json:"token"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type PasswordResetRequest struct {
	ResetEmail string `json:"resetEmail" binding:"required"`
}

type PassswordReset struct {
	Password string `json:"password" binding:"required"`
	Token    string `json:"token"`
}

func generateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CreateUserHandler(pool *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var registerRequest RegisterRequest

		if err := c.BindJSON(&registerRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if len(registerRequest.Password) < 4 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 4 characters long"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(registerRequest.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password " + err.Error()})
			return
		}

		user := &models.User{
			Username: registerRequest.Username,
			Email:    registerRequest.Email,
			Password: string(hashedPassword),
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

		token, err := generateVerificationToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
			return
		}

		expiresAt := time.Now().Add(24 * time.Hour)
		err = repository.SetVerificationToken(pool, createdUser.ID, token, expiresAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save verification token"})
			return
		}

		verifyURL := fmt.Sprintf("%s/verify?token=%s", cfg.FrontendURL, token)
		html := email.VerificationEmailHTML(cfg.FrontendURL, verifyURL)
		if err := email.SendEmail(cfg.ResendAPIKey, createdUser.Email, "Verify your email", html); err != nil {
			err = repository.DeleteUser(pool, createdUser.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification email"})
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

		if loginRequest.Token != "" {
			err = repository.VerifyUserByToken(pool, loginRequest.Token, user.ID)
			if err != nil {
				if strings.Contains(err.Error(), "invalid") {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			user.Email_verified = true
		}

		if !user.Email_verified {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User is not verified, please check your email"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token " + err.Error()})
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

func PasswordResetHandler(pool *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var passwordResetRequest PasswordResetRequest

		if err := c.BindJSON(&passwordResetRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := repository.GetUserByEmail(pool, passwordResetRequest.ResetEmail)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "If that email exists, a reset link has been sent."})
			return
		}

		token, err := generateVerificationToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
			return
		}

		expiresAt := time.Now().Add(1 * time.Hour)
		err = repository.SetPasswordResetToken(pool, user.ID, token, expiresAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save verification token"})
			return
		}

		verifyURL := fmt.Sprintf("%s/verify-password?token=%s", cfg.FrontendURL, token)
		html := email.PasswordResetEmailHTML(cfg.FrontendURL, verifyURL)
		if err := email.SendEmail(cfg.ResendAPIKey, user.Email, "Reset your password", html); err != nil {
			log.Println("Failed to send verification email:", err)
		}

		c.JSON(http.StatusOK, user)
	}
}

func VerifyPasswordReset(pool *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var passswordReset PassswordReset

		if err := c.BindJSON(&passswordReset); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if len(passswordReset.Password) < 4 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 4 characters long"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(passswordReset.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password " + err.Error()})
			return
		}

		err = repository.VerifyPasswordResetToken(pool, passswordReset.Token, string(hashedPassword))
		if err != nil {
			if strings.Contains(err.Error(), "invalid") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusAccepted, gin.H{
			"message": "Password reset successful",
		})
	}
}
