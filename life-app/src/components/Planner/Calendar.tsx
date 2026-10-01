import { useEffect, useState } from "react";
import styles from './Calendar.module.css'
import add from '../../components/assets/add.png';
import low_priority from '../../components/assets/low_priority.png';
import medium_priority from '../../components/assets/medium_priority.png';
import high_priority from '../../components/assets/high_priority.png';
import NewTaskForm, { type NewTaskFormData } from './components/NewItem/NewItem';
import PlannerNavbar from '../Navbars/Planner_navbar';
import { createItem, getAllItems } from '../../api/items';
import type { Item } from './components/ItemType';

type CalendarView = 'month' | 'week' | 'day';

const priorityImages: Record<string, string> = {
    low: low_priority,
    medium: medium_priority,
    high: high_priority,
};

function getPriorityImage(priority: string): string | undefined {
    return priorityImages[priority.toLowerCase()];
}

function getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
    return firstDay;
}

function dayNumber(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000;
}

function normaliseVisibleDate(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function normaliseTimestampDate(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatCalendarTime(startAt: string | null): string | null {
    if (!startAt) return null;

    const startDate = new Date(startAt);
    if (startDate.getUTCHours() === 0 && startDate.getUTCMinutes() === 0) return null;

    return startDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
    });
}

function itemOccursOnDate(item: Item, date: Date): boolean {
    if (!item.start_at) return false;

    const calendarDate = normaliseVisibleDate(date);
    const startDate = normaliseTimestampDate(new Date(item.start_at));
    const dayOffset = dayNumber(calendarDate) - dayNumber(startDate);
    if (dayOffset < 0) return false;

    if (item.is_recurring && item.recurrence_rule) {
        switch (item.recurrence_rule) {
            case 'daily':
                return true;
            case 'weekly':
                return calendarDate.getUTCDay() === startDate.getUTCDay();
            case 'monthly': {
                const lastDay = new Date(Date.UTC(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth() + 1, 0)).getUTCDate();
                return calendarDate.getUTCDate() === Math.min(startDate.getUTCDate(), lastDay);
            }
            case 'yearly':
                return calendarDate.getUTCMonth() === startDate.getUTCMonth()
                    && calendarDate.getUTCDate() === startDate.getUTCDate();
            case 'custom':
                return Boolean(item.recurrence_rule_custom && dayOffset % item.recurrence_rule_custom === 0);
        }
    }

    if (!item.end_at) return dayOffset === 0;
    return dayNumber(calendarDate) <= dayNumber(normaliseTimestampDate(new Date(item.end_at)));
}

function Calendar () {
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'task' | 'reminder'>('task');
    const [view, setView] = useState<CalendarView>('month');
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [items, setItems] = useState<Item[]>([]);
    const [itemsError, setItemsError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        getAllItems()
            .then((calendarItems) => {
                if (active) setItems(calendarItems);
            })
            .catch((error: unknown) => {
                if (active) {
                    setItemsError(error instanceof Error ? error.message : 'Failed to load calendar items');
                }
            });

        return () => { active = false; };
    }, []);
    
    function openNewForm() {
        setFormType('task');
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
            folder_id: data.folder_id ?? null,
            description: data.description || null,
            priority: data.priority,
            is_recurring: data.recurrenceRule !== 'none',
            recurrence_rule: data.recurrenceRule !== 'none' ? data.recurrenceRule : null,
            recurrence_rule_custom: data.recurrenceRule === 'custom' ? data.recurrenceCustom : null,
            start_at: buildTimestamp(data.startDate, data.startTime, data.entireDay),
            end_at: buildTimestamp(data.endDate, data.endTime, data.entireDay),
            email_reminder: data.emailReminder,
        };
        const createdItem = await createItem(payload);
        setItems((currentItems) => [...currentItems, createdItem]);
    }

    function changePeriod(direction: -1 | 1) {
        setSelectedDate((currentDate) => {
            const nextDate = new Date(currentDate);
            if (view === 'month') {
                const selectedDay = nextDate.getDate();
                nextDate.setDate(1);
                nextDate.setMonth(nextDate.getMonth() + direction);
                const lastDayOfTargetMonth = new Date(
                    nextDate.getFullYear(),
                    nextDate.getMonth() + 1,
                    0,
                ).getDate();
                nextDate.setDate(Math.min(selectedDay, lastDayOfTargetMonth));
            } else if (view === 'week') nextDate.setDate(nextDate.getDate() + direction * 7);
            else nextDate.setDate(nextDate.getDate() + direction);
            return nextDate;
        });
    }

    const visibleDays = (() => {
        if (view === 'day') return [new Date(selectedDate)];
        if (view === 'week') {
            const firstDay = startOfWeek(selectedDate);
            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(firstDay);
                date.setDate(firstDay.getDate() + index);
                return date;
            });
        }

        const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const gridStart = startOfWeek(firstDay);
        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);
            return date;
        });
    })();

    const periodTitle = view === 'month'
        ? selectedDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
        : view === 'week'
            ? `${visibleDays[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${visibleDays[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className={styles.Calendar}>
            <PlannerNavbar />
            <div className={styles.calendar_layout}>
                <div className={styles.card}>
                    <div className={styles.left_section}>
                        <div className={styles.create_row}>
                            <button className={styles.left_section_buttons} onClick={() => openNewForm()}>
                                <img src={add} width="50" height="50"/>
                            </button>
                            <h2>Create</h2>
                        </div>

                        <button type="button" className={styles.today_button} onClick={() => {
                            setSelectedDate(new Date());
                            setView('day');
                        }}>
                            <h2>Today</h2>
                        </button>
                        <select
                            className={styles.calendar_view_select}
                            aria-label="Calendar view"
                            value={view}
                            onChange={(event) => setView(event.target.value as CalendarView)}
                        >
                            <option value="month">Month</option>
                            <option value="week">Week</option>
                            <option value="day">Day</option>
                        </select>
                    </div>
                    <div className={styles.right_section}>
                        <div className={styles.calendar_header}>
                            <div className={styles.period_navigation}>
                                <button type="button" aria-label="Previous period" onClick={() => changePeriod(-1)}>‹</button>
                                <button type="button" aria-label="Next period" onClick={() => changePeriod(1)}>›</button>
                            </div>
                            <h1>{periodTitle}</h1>
                        </div>
                        {itemsError && <p className={styles.calendar_error}>{itemsError}</p>}
                        <div className={`${styles.calendar_grid} ${styles[`${view}_view`]}`}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <div className={styles.weekday} key={day}>{day}</div>
                            ))}
                            {visibleDays.map((date) => {
                                const dayItems = items.filter((item) => itemOccursOnDate(item, date));
                                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                                const isToday = getDateKey(date) === getDateKey(new Date());
                                return (
                                    <div
                                        className={`${styles.day_cell} ${view === 'month' && !isCurrentMonth ? styles.outside_month : ''} ${isToday ? styles.current_day : ''}`}
                                        key={getDateKey(date)}
                                    >
                                        <span className={styles.day_number}>{date.getDate()}</span>
                                        <div className={styles.day_items}>
                                            {dayItems.map((item) => (
                                                <div className={`${styles.calendar_item} ${item.type === 'reminder' ? styles.reminder_item : ''}`} key={item.id} title={item.title}>
                                                    {view !== 'month' && formatCalendarTime(item.start_at) && (
                                                        <time>{formatCalendarTime(item.start_at)}</time>
                                                    )}
                                                    <span>{item.title}</span>
                                                    {getPriorityImage(item.priority) && (
                                                        <img
                                                            className={styles.calendar_priority_icon}
                                                            src={getPriorityImage(item.priority)}
                                                            alt={`${item.priority} priority`}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
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

export default Calendar;