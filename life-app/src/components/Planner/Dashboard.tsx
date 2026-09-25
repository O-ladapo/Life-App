import styles from './Dashboard.module.css'
import PlannerNavbar from '../Navbars/Planner_navbar';
import NewTaskForm, { type NewTaskFormData } from './components/NewItem/NewItem';
import { useState } from 'react';
import { createItem } from '../../api/items';
import { useItemsByDate } from './components/GetItems/GetItemsByDate';
import task from '../assets/task.png'
import reminder from '../assets/reminder.png'

const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function Dashboard() {
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'task' | 'reminder'>('task');
    const todayStr = getLocalDateString(new Date());
    const { items, setItems } = useItemsByDate(todayStr);


    function openNewTaskForm() {
        setFormType('task');
        setShowForm(true);
    }

    function openNewReminderForm() {
        setFormType('reminder');
        setShowForm(true);
    }

    async function handleCreateItem(data: NewTaskFormData  & { type: 'task' | 'reminder' }) {
        function buildTimestamp(date: string, time: string, entireDay: boolean): string | null {
            if (!date) return null;

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = (time || '00:00').split(':').map(Number);
            if (entireDay) {
                return new Date(Date.UTC(year, month - 1, day, 0, 0)).toISOString();
            }

            return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString();
        }
        const payload = {
            title: data.title,
            type: data.type,
            description: data.description || null,
            priority: data.priority,
            is_recurring: data.recurrenceRule !== 'none',
            recurrence_rule: data.recurrenceRule !== 'none' ? data.recurrenceRule : null,
            recurrence_rule_custom: data.recurrenceRule === 'custom' ? data.recurrenceCustom : null,
            start_at: buildTimestamp(data.startDate, data.startTime, data.entireDay),
            end_at: buildTimestamp(data.endDate, data.endTime, data.entireDay),
            email_reminder: data.type === 'reminder' ? data.emailReminder : false,
        };
        const createdItem = await createItem(payload);

        if (createdItem.start_at?.slice(0, 10) === todayStr) {
            setItems((prev) => [...prev, createdItem]);
        }
    }

    const tasks = items.filter((item) => item.type === 'task');
    const reminders = items.filter((item) => item.type === 'reminder');

    return (
        <div className={styles.dashboard}>
            <PlannerNavbar />
            <div className={styles.date}>
                {currentDate}
            </div>

            <div className={styles.items_content}>
                <div>
                    <h3>Tasks</h3>
                    {tasks.map((t) => (
                        <div key={t.id} className={styles.item_row}>
                            <img src={task} width="42" height="42" alt="task" />
                            <span className={styles.item_title}>{t.title}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <h3>Reminders</h3>
                    {reminders.map((r) => (
                        <div key={r.id} className={styles.item_row}>
                            <img src={reminder} width="42" height="42" alt="reminder" />
                            <span className={styles.item_title}>{r.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.dashboard_buttons_row}>
                <button className={styles.dashboard_buttons} onClick={openNewTaskForm}> Add New Task </button>
                <button className={styles.dashboard_buttons} onClick={openNewReminderForm}> Add New Reminder </button>
            </div>
            <div className={styles.insights}>
                <h1>Your Insights</h1>
            </div>
            {showForm && (
                <NewTaskForm
                    initialType={formType}
                    onClose={() => setShowForm(false)}
                    onCreateTask={handleCreateItem}
                />
            )}

        </div>
    )
}

export default Dashboard;