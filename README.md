# Life-App
Creating a general life app designed to include features that I use in my day-to-day life.
Main features so far: Planner, (*Planned: Budget Calculator, Fitness Tracker.*)
🔗 **Live demo:** [life-app-blue-five.vercel.app](https://life-app-blue-five.vercel.app)
Tech Stack: 
- Frontend: React + Typescript + Vite
- Backend: Golang, Gin
- Database: PostgreSQL
- Auth: JWT, bcrypt
- Deploymeent: Vercel (frontend), Railway (backend + database)

# Login/Register Pages
### Features 
- Registration and login with JWT-based authentication
- Passwords hashed with bcrypt, never stored in plain text
- Email verification: New accounts receive a verification link (via Resend) before gaining full access
- Password reset feature: self-service reset flow using time-limited, single-use tokens sent by email

# Planner
### Features 
- Task Management
- Reminders List
- Dashboard insights 
- Calendar synced with tasks and reminders

### Dashboard insights 
- Display the current day tasks and reminders
- Access to task management, calendar, or reminders
	
### Task Management
- Add/Edit/Update/Delete tasks
- View upcoming and completed tasks
- Organise tasks by categories
- Be able to track progress of tasks
- Sort tasks. (progress, priority, due date)
- Search tasks

### Reminders
- Add/Edit/Update/Delete reminders
- Be able to set recurring reminders (daily, monthly, yearly)
- Email/Notifications for reminders

### Calendar

- Display reminders and tasks in the calendar
- Search for tasks
- Be able to change the calendar view (Weeks, Months, Years)




