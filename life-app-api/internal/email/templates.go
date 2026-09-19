package email

import "fmt"

func emailWrapper(bodyContent string) string {
	return fmt.Sprintf(`
		<div style="background-color:#0A002D;font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;">
			<img src="https://life-app.vercel.app/infinity.png" width="120" height="72" alt="Life App logo" />
			%s
		</div>
	`, bodyContent)
}

func VerificationEmailHTML(verifyURL string) string {
	body := fmt.Sprintf(`
		<h1 style="color:#FFFFFF;font-size:28px;font-weight:bold;margin-top:24px;">Please verify your email</h1>
		<p style="color:#cccccc;font-size:16px;">Click the button below to verify your email address.</p>
		<a href="%s" style="background-color:#aa3bff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold;">
			Verify Email
		</a>
	`, verifyURL)
	return emailWrapper(body)
}

func PasswordResetEmailHTML(resetURL string) string {
	body := fmt.Sprintf(`
		<h1 style="color:#FFFFFF;font-size:28px;font-weight:bold;margin-top:24px;">Reset your password</h1>
		<p style="color:#cccccc;font-size:16px;">Click the button below to choose a new password. This link expires in 1 hour.</p>
		<a href="%s" style="background-color:#aa3bff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold;">
			Reset Password
		</a>
	`, resetURL)
	return emailWrapper(body)
}