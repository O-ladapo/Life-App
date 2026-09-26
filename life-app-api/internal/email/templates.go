package email

import (
	"fmt"
	"life_app_api/internal/models"
	"strings"
)

func emailWrapper(frontendURL, bodyContent string) string {
	return fmt.Sprintf(`
		<div style="background-color:#0A002D;font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;">
			<img src="%s/infinity.png" width="120" height="72" alt="Life App logo" />
			%s
		</div>
	`, frontendURL, bodyContent)
}

func VerificationEmailHTML(frontendURL, verifyURL string) string {
	body := fmt.Sprintf(`
		<h1 style="color:#FFFFFF;font-size:28px;font-weight:bold;margin-top:24px;">Please verify your email</h1>
		<p style="color:#cccccc;font-size:16px;">Click the button below to verify your email address.</p>
		<a href="%s" style="background-color:#aa3bff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold;">
			Verify Email
		</a>
	`, verifyURL)
	return emailWrapper(frontendURL, body)
}

func PasswordResetEmailHTML(frontendURL, resetURL string) string {
	body := fmt.Sprintf(`
		<h1 style="color:#FFFFFF;font-size:28px;font-weight:bold;margin-top:24px;">Reset your password</h1>
		<p style="color:#cccccc;font-size:16px;">Click the button below to choose a new password. This link expires in 1 hour.</p>
		<a href="%s" style="background-color:#aa3bff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold;">
			Reset Password
		</a>
	`, resetURL)
	return emailWrapper(frontendURL, body)
}

func ReminderEmailHTML(frontendURL string, reminders []models.Item) string {
	var reminderListHTML strings.Builder

	for _, reminder := range reminders {
		fmt.Fprintf(&reminderListHTML, `
            <div style="background-color:#0A002D;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
                <p style="color:#FFFFFF;font-size:16px;font-weight:bold;margin:0;">%s</p>
        `, reminder.Title)

		if reminder.StartAt != nil {
			var formattedTime string
			if reminder.StartAt.Hour() == 0 && reminder.StartAt.Minute() == 0 && reminder.StartAt.Second() == 0 {
    		    formattedTime = ""
    		} else {
    		    formattedTime = fmt.Sprintf("Starts: %s", reminder.StartAt.Format("3:04 PM"))
			fmt.Fprintf(&reminderListHTML, `
                <p style="color:#cccccc;font-size:14px;margin:4px 0 0;">%s</p>
            `, formattedTime)
		}
		reminderListHTML.WriteString(`</div>`)
		}
	}

	body := fmt.Sprintf(`
        <h1 style="color:#FFFFFF;font-size:28px;font-weight:bold;margin-top:24px;">Here are your reminders for today</h1>
        <p style="color:#cccccc;font-size:16px;">Here are a list of your reminders:</p>
        %s
    `, reminderListHTML.String())

	return emailWrapper(frontendURL, body)
}