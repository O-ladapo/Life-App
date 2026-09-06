CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('task', 'reminder')),
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('none', 'low', 'medium', 'high')) DEFAULT 'none',
    completed BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule varchar(20) CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
    recurrence_rule_custom INTEGER,
    start_at TIMESTAMP,
    end_at TIMESTAMP,
    email_reminder BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);