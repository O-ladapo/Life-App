import styles from './TaskManagement.module.css'
import PlannerNavbar from '../Navbars/Planner_navbar';
import add from '../../components/assets/add.png';
import folder from '../../components/assets/folder.png';
import low_priority from '../../components/assets/low_priority.png';
import medium_priority from '../../components/assets/medium_priority.png';
import high_priority from '../../components/assets/high_priority.png';
import clock from '../../components/assets/clock.png';
import NewTaskForm, { type NewTaskFormData } from './components/NewItem/NewItem';
import NewFolderForm, { type NewFolderFormData } from './components/NewFolder/NewFolder';
import { useItemsByDate } from './components/GetItems/GetItemsByDate';
import { useUpcomingItemsByDate } from './components/GetItems/GetUpcomingItemsByDate';
import { createItem } from '../../api/items';
import { useEffect, useState } from 'react';
import { createFolder, getAllFolders } from '../../api/folders';

type Folder = {
    id: number;
    title: string;
    type: 'task' | 'reminder';
};

function getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const priorityImages: Record<string, string> = {
    low: low_priority,
    medium: medium_priority,
    high: high_priority,
};

function getPriorityImage(priority: string): string | undefined {
    return priorityImages[priority.toLowerCase()];
}

function formatTaskTime(startAt: string | null, endAt: string | null): string | null {
    const startDate = startAt ? new Date(startAt) : null;
    const endDate = endAt ? new Date(endAt) : null;
    const bothAtMidnight = startDate
        && endDate
        && startDate.getUTCHours() === 0
        && startDate.getUTCMinutes() === 0
        && endDate.getUTCHours() === 0
        && endDate.getUTCMinutes() === 0;

    if (bothAtMidnight) return null;

    const formatTime = (value: string | null) => {
        if (!value) return null;

        const date = new Date(value);
        if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
            return '00:00';
        }

        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'UTC',
        });
    };
    const startTime = formatTime(startAt);
    const endTime = formatTime(endAt);

    if (startTime && startTime === endTime) return startTime;
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    return startTime ?? endTime ?? 'No time set';
}

function TaskManagement() {
    const [showForm, setShowForm] = useState(false);
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [formType, setFormType] = useState<'task' | 'reminder'>('task');
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedView, setSelectedView] = useState<'today' | 'upcoming'>('today');
    const todayStr = getLocalDateString(new Date());
    const {
        items: todayItems,
        setItems,
        loading: todayLoading,
        error: todayError,
    } = useItemsByDate(todayStr);
    const {
        items: upcomingItems,
        refetch: refetchUpcomingItems,
        loading: upcomingLoading,
        error: upcomingError,
    } = useUpcomingItemsByDate(todayStr, 'task');

    function openNewTaskForm() {
        setFormType('task');
        setShowForm(true);
    }

    function openNewFolderForm() {
        setFormType('task');
        setShowFolderForm(true);
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

        const createdStartDate = createdItem.start_at?.slice(0, 10);

        if (createdStartDate === todayStr) {
            setItems((prev) => [...prev, createdItem]);
        } else if (createdStartDate && createdStartDate > todayStr) {
            await refetchUpcomingItems();
        }
    }

    async function handleCreateFolder(data: NewFolderFormData  & { type: 'task' | 'reminder' }) {
        const payload = {
            title: data.title,
            type: data.type,
        };
        const createdFolder = await createFolder(payload) as Folder;
        setFolders((prev) => [...prev, createdFolder]);
    }

    useEffect(() => {
        async function loadFolders() {
            try {
                const response = await getAllFolders();
                const allFolders = Array.isArray(response) ? response as Folder[] : [];
                setFolders(allFolders.filter((folder) => folder.type === 'task'));
            } catch (error) {
                console.error('Failed to load folders', error);
                setFolders([]);
            }
        }

        loadFolders();
    }, []);

    const taskFolders = folders.filter((folder) => folder.type === 'task');
    const tasks = todayItems.filter((item) => item.type === 'task');
    const upcomingTasks = upcomingItems.filter((item) => item.type === 'task');
    
    return (
        <div className={styles.TaskManagement}>
            <PlannerNavbar />
            <div className={styles.task_layout}>
                <div className={styles.card}>
                    <div className={styles.left_section}>
                        <div className={styles.add_task_row}>
                            <button className={styles.left_section_buttons} onClick={openNewTaskForm}>
                                <img src={add} width="50" height="50"/>
                            </button>
                            <h2>Add Task</h2>
                        </div>
                        
                        <button type="button" className={styles.today_button} onClick={() => setSelectedView('today')}>
                            <h2>Today</h2>
                        </button>
                        <button type="button" className={styles.upcoming_button} onClick={() => setSelectedView('upcoming')}>
                            <h2>Upcoming</h2>
                        </button>

                        <div className={styles.display_folder_row}>
                            <img src={folder} width="50" height="50"/>
                            <h2>My Folders</h2>
                        </div>

                        <div className={styles.folder_list}>
                            {taskFolders.map((f) => (
                                <button key={f.id} type="button" className={styles.folder_item}>
                                    <span className={styles.folder_bullet}>•</span>
                                    <span>{f.title}</span>
                                </button>
                            ))}
                        </div>

                        <div className={styles.add_folder_row}>
                            <button className={styles.left_section_buttons} onClick={openNewFolderForm}>
                                <img src={add} width="50" height="50"/>
                            </button>
                            <h2>Add Folder</h2>
                        </div>
                    </div>
                    <div className={styles.right_section}>
                        <div className={styles.right_section_header}>
                            <h2 className={styles.right_section_title}>
                                {selectedView === 'today' ? 'Today' : 'Upcoming'}
                            </h2>
                        </div>
                        <div className={styles.line} />

                        {selectedView === 'today' && !todayLoading && todayError && (
                            <p className={styles.items_status}>{todayError}</p>
                        )}
                        {selectedView === 'today' && !todayLoading && !todayError && tasks.map((todayTasks) => (
                            <div key={todayTasks.id} className={styles.task_item}>
                                <input type="checkbox" className={styles.task_checkbox} />
                                <div className={styles.task_content}>
                                    <div className={styles.task_title_row}>
                                        <span className={styles.task_text}>{todayTasks.title}</span>
                                        {getPriorityImage(todayTasks.priority) && (
                                            <img
                                                className={styles.priority_icon}
                                                src={getPriorityImage(todayTasks.priority)}
                                            />
                                        )}
                                    </div>
                                    {formatTaskTime(todayTasks.start_at, todayTasks.end_at) && (
                                        <div className={styles.task_time}>
                                            <img src={clock} />
                                            <span>{formatTaskTime(todayTasks.start_at, todayTasks.end_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.task_line} />
                            </div>
                        ))}

                        {selectedView === 'upcoming' && !upcomingLoading && upcomingError && (
                            <p className={styles.items_status}>{upcomingError}</p>
                        )}
                        {selectedView === 'upcoming' && !upcomingLoading && !upcomingError && upcomingTasks.map((upcomingTasks) => (
                            <div key={upcomingTasks.id} className={styles.task_item}>
                                <input type="checkbox" className={styles.task_checkbox} />
                                <div className={styles.task_content}>
                                    <div className={styles.task_title_row}>
                                        <span className={styles.task_text}>{upcomingTasks.title}</span>
                                        {getPriorityImage(upcomingTasks.priority) && (
                                            <img
                                                className={styles.priority_icon}
                                                src={getPriorityImage(upcomingTasks.priority)}
                                            />
                                        )}
                                    </div>
                                    {formatTaskTime(upcomingTasks.start_at, upcomingTasks.end_at) && (
                                        <div className={styles.task_time}>
                                            <img src={clock} alt="" />
                                            <span>{formatTaskTime(upcomingTasks.start_at, upcomingTasks.end_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.task_line} />
                            </div>
                        ))}
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
            {showFolderForm && (
                <NewFolderForm
                    initialType={formType}
                    onClose={() => setShowFolderForm(false)}
                    onCreateFolder={handleCreateFolder}
                />
            )}
        </div>
    )
}

export default TaskManagement;