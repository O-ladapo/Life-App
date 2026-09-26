export type Item = {
    id: number;
    folder_id: number | null;
    title: string;
    type: 'task' | 'reminder';
    description: string | null;
    priority: string;
    completed: boolean;
    is_recurring: boolean;
    recurrence_rule: string | null;
    recurrence_rule_custom: number | null;
    start_at: string | null;
    end_at: string | null;
    email_reminder: boolean;
    created_at: string;
};