package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func SendEmail(apiKey, toEmail, subject, htmlBody string) error {
	body := map[string]string{
		"from":    "onboarding@resend.dev",
		"to":      toEmail,
		"subject": subject,
		"html":    htmlBody,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("resend API returned status %d", resp.StatusCode)
	}
	return nil
}