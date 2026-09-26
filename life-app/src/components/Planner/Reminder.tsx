import styles from './Reminder.module.css'
import PlannerNavbar from '../Navbars/Planner_navbar';
import add from '../../components/assets/add.png';
import folder from '../../components/assets/folder.png';
import low_priority from '../../components/assets/low_priority.png';
import medium_priority from '../../components/assets/medium_priority.png';
import high_priority from '../../components/assets/high_priority.png';
import clock from '../../components/assets/clock.png';
import edit from '../../components/assets/edit.png';
import deleteIcon from '../../components/assets/delete.png';
import NewTaskForm, { type NewTaskFormData } from './components/NewItem/NewItem';
import NewFolderForm, { type NewFolderFormData } from './components/NewFolder/NewFolder';
import EditFolder, { type EditFolderFormData } from './components/EditFolder/EditFolder';
import EditTaskForm, { type EditTaskFormData } from './components/EditItem/EditItem';
import DeleteItem from './components/DeleteItem/DeleteItem';
import { useItemsByDate } from './components/GetItems/GetItemsByDate';
import { useUpcomingItemsByDate } from './components/GetItems/GetUpcomingItemsByDate';
import type { Item } from './components/ItemType';
import { createItem, updateItem, deleteItem, getAllItems } from '../../api/items';
import { useEffect, useRef, useState } from 'react';
import { createFolder, getAllFolders, updateFolder, deleteFolder } from '../../api/folders';

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

function formatReminderTime(startAt: string | null): string | null {
    const startDate = startAt ? new Date(startAt) : null;
    const atMidnight = startDate
        && startDate.getUTCHours() === 0
        && startDate.getUTCMinutes() === 0

    if (atMidnight) return null;

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

    return startTime ?? 'No time set';
}

function Reminders() {
    const [showForm, setShowForm] = useState(false);
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showEditReminderForm, setShowEditReminderForm] = useState(false);
    const [selectedEditReminderId, setSelectedEditReminderId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string; view: 'today' | 'upcoming' | 'folder' } | null>(null);
    const [showDeleteFolderForm, setShowDeleteFolderForm] = useState(false);
    const [newReminderFolder, setNewReminderFolder] = useState<Folder | null>(null);
    const [showEditFolderForm, setShowEditFolderForm] = useState(false);
    const [formType, setFormType] = useState<'task' | 'reminder'>('reminder');
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'folder'>('today');
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [folderItems, setFolderItems] = useState<Item[]>([]);
    const [folderLoading, setFolderLoading] = useState(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderActionError, setFolderActionError] = useState<string | null>(null);
    const [todayActionError, setTodayActionError] = useState<string | null>(null);
    const [upcomingActionError, setUpcomingActionError] = useState<string | null>(null);
    const folderRequestIdRef = useRef(0);
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
    } = useUpcomingItemsByDate(todayStr, 'reminder');

    function openNewReminderForm(folder: Folder | null = null) {
        setFormType('reminder');
        setNewReminderFolder(folder);
        setShowForm(true);
    }

    function openNewFolderForm() {
        setFormType('reminder');
        setShowFolderForm(true);
    }

    function openEditFolderForm() {
        if (selectedFolder) setShowEditFolderForm(true);
    }

    function openEditReminderForm(itemId: number) {
        setSelectedEditReminderId(itemId);
        setShowEditReminderForm(true);
    }

    async function openFolder(folder: Folder) {
        const requestId = ++folderRequestIdRef.current;

        setSelectedFolder(folder);
        setSelectedView('folder');
        setFolderLoading(true);
        setFolderError(null);

        try {
            const items = await getAllItems();
            if (requestId !== folderRequestIdRef.current) return;

            setFolderItems(items.filter((item) => item.type === 'reminder' && item.folder_id === folder.id));
        } catch (error) {
            if (requestId !== folderRequestIdRef.current) return;

            setFolderItems([]);
            setFolderError(error instanceof Error ? error.message : 'Failed to load folder items');
        } finally {
            if (requestId === folderRequestIdRef.current) {
                setFolderLoading(false);
            }
        }
    }

    async function handleCreateReminder(data: NewTaskFormData  & { type: 'task' | 'reminder' }) {
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

        if (data.folder_id) {
            const selectedFolderMatches = selectedFolder?.id === data.folder_id;

            folderRequestIdRef.current++;

            if (selectedFolderMatches) {
                setFolderLoading(false);
                setFolderError(null);
                setFolderItems((prev) => [
                    ...prev.filter((item) => item.id !== createdItem.id),
                    createdItem,
                ]);
            }
        }

        if (data.folder_id) return;

        const createdStartDate = createdItem.start_at?.slice(0, 10);

        if (createdStartDate === todayStr) {
            setItems((prev) => [...prev, createdItem]);
        } else if (createdStartDate && createdStartDate > todayStr) {
            await refetchUpcomingItems();
        }
    }

    async function handleToggleReminder(itemId: number, completed: boolean, view: 'today' | 'upcoming' | 'folder') {
        if (view === 'today') setTodayActionError(null);
        if (view === 'upcoming') setUpcomingActionError(null);
        if (view === 'folder') setFolderActionError(null);

        try {
            const updatedItem = await updateItem(itemId, { completed });

            if (view === 'upcoming') {
                await refetchUpcomingItems();
                return;
            }

            if (view === 'folder') {
                setFolderItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
                return;
            }

            setItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update reminder';
            if (view === 'today') setTodayActionError(message);
            if (view === 'upcoming') setUpcomingActionError(message);
            if (view === 'folder') setFolderActionError(message);
        }
    }

    function openDeleteReminderForm(itemId: number, title: string, view: 'today' | 'upcoming' | 'folder') {
        setDeleteTarget({ id: itemId, title, view });
    }

    async function handleDeleteReminder() {
        if (!deleteTarget) return;

        await deleteItem(deleteTarget.id);

        if (deleteTarget.view === 'upcoming') {
            await refetchUpcomingItems();
        } else if (deleteTarget.view === 'folder') {
            setFolderItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        } else {
            setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        }

        setDeleteTarget(null);
    }

    async function handleEditReminder(data: EditTaskFormData) {
        if (selectedEditReminderId === null) return;

        const buildTimestamp = (date: string, time: string, entireDay: boolean): string | null => {
            if (!date) return null;

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = (time || '00:00').split(':').map(Number);
            return new Date(Date.UTC(
                year,
                month - 1,
                day,
                entireDay ? 0 : hours,
                entireDay ? 0 : minutes,
            )).toISOString();
        };
        const updatedItem = await updateItem(selectedEditReminderId, {
            title: data.title,
            description: data.description || null,
            priority: data.priority,
            is_recurring: data.recurrenceRule !== 'none',
            recurrence_rule: data.recurrenceRule !== 'none' ? data.recurrenceRule : null,
            recurrence_rule_custom: data.recurrenceRule === 'custom' ? data.recurrenceCustom : null,
            start_at: buildTimestamp(data.startDate, data.startTime, data.entireDay),
            end_at: buildTimestamp(data.endDate, data.endTime, data.entireDay),
            email_reminder: data.emailReminder,
        });
        const updatedStartDate = updatedItem.start_at?.slice(0, 10);

        if (updatedItem.folder_id !== null) {
            setFolderItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
            setItems((prev) => prev.filter((item) => item.id !== updatedItem.id));
            await refetchUpcomingItems();
            return;
        }

        setItems((prev) => {
            const withoutUpdatedItem = prev.filter((item) => item.id !== updatedItem.id);
            return updatedStartDate === todayStr
                ? [...withoutUpdatedItem, updatedItem]
                : withoutUpdatedItem;
        });
        await refetchUpcomingItems();
    }

    function closeEditReminderForm() {
        setShowEditReminderForm(false);
        setSelectedEditReminderId(null);
    }

    async function handleCreateFolder(data: NewFolderFormData  & { type: 'task' | 'reminder' }) {
        const payload = {
            title: data.title,
            type: data.type,
        };
        const createdFolder = await createFolder(payload) as Folder;
        setFolders((prev) => [...prev, createdFolder]);
    }

    async function handleEditFolder(data: EditFolderFormData) {
        if (!selectedFolder) return;

        const updatedFolder = await updateFolder(selectedFolder.id, { title: data.title }) as Folder;
        setFolders((prev) => prev.map((folder) => folder.id === updatedFolder.id ? updatedFolder : folder));
        setSelectedFolder(updatedFolder);
    }

    async function handleDeleteFolder() {
        if (!selectedFolder) return;

        await deleteFolder(selectedFolder.id);
        setFolders((prev) => prev.filter((folder) => folder.id !== selectedFolder.id));
        setSelectedFolder(null);
        setFolderItems([]);
        setSelectedView('today');
    }

    useEffect(() => {
        async function loadFolders() {
            try {
                const response = await getAllFolders();
                const allFolders = Array.isArray(response) ? response as Folder[] : [];
                setFolders(allFolders.filter((folder) => folder.type === 'reminder'));
            } catch (error) {
                console.error('Failed to load folders', error);
                setFolders([]);
            }
        }

        loadFolders();
    }, []);

    const reminderFolders = folders.filter((folder) => folder.type === 'reminder');
    const reminders = todayItems.filter((item) => item.type === 'reminder');
    const upcomingReminders = upcomingItems.filter((item) => item.type === 'reminder');
    
    return (
        <div className={styles.Reminder}>
            <PlannerNavbar />
            <div className={styles.reminder_layout}>
                <div className={styles.card}>
                    <div className={styles.left_section}>
                        <div className={styles.add_reminder_row}>
                            <button className={styles.left_section_buttons} onClick={() => openNewReminderForm()}>
                                <img src={add} width="50" height="50"/>
                            </button>
                            <h2>Add Reminder</h2>
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
                            {reminderFolders.map((f) => (
                                    <button key={f.id} type="button" className={styles.folder_item} onClick={() => openFolder(f)}>
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
                        <div className={`${styles.right_section_header} ${selectedView === 'folder' ? styles.folder_section_header : ''}`}>
                            <h2 className={`${styles.right_section_title} ${selectedView === 'folder' ? styles.folder_section_title : ''}`}>
                                {selectedView === 'today'
                                    ? 'Today'
                                    : selectedView === 'upcoming'
                                        ? 'Upcoming'
                                        : selectedFolder?.title}
                            </h2>
                                {selectedView === 'folder' && selectedFolder && (
                                    <div className={styles.folder_header_actions}>
                                        <button
                                            type="button"
                                            className={styles.folder_add_reminder_button}
                                            onClick={() => openNewReminderForm(selectedFolder)}
                                        >
                                            Add Reminder
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.folder_add_reminder_button}
                                            onClick={openEditFolderForm}
                                        >
                                            Edit Folder
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.folder_add_reminder_button}
                                            onClick={() => setShowDeleteFolderForm(true)}
                                        >
                                            Delete Folder
                                        </button>
                                    </div>
                                )}
                        </div>
                        <div className={styles.line} />

                        {selectedView === 'today' && !todayLoading && (todayError || todayActionError) && (
                            <p className={styles.items_status}>{todayError || todayActionError}</p>
                        )}
                        {selectedView === 'today' && !todayLoading && !todayError && reminders.map((todayReminder) => (
                            <div key={todayReminder.id} className={styles.reminder_item}>
                                <input
                                    type="checkbox"
                                    className={styles.reminder_checkbox}
                                    checked={todayReminder.completed}
                                    onChange={(event) => handleToggleReminder(todayReminder.id, event.target.checked, 'today')}
                                />
                                <div className={styles.reminder_content}>
                                    <div className={styles.reminder_title_row}>
                                        <span className={styles.reminder_text}>{todayReminder.title}</span>
                                        {getPriorityImage(todayReminder.priority) && (
                                            <img
                                                className={styles.priority_icon}
                                                src={getPriorityImage(todayReminder.priority)}
                                            />
                                        )}
                                    </div>
                                    {formatReminderTime(todayReminder.start_at) && (
                                        <div className={styles.reminder_time}>
                                            <img src={clock} />
                                            <span>{formatReminderTime(todayReminder.start_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.reminder_actions}>
                                    <button type="button" className={styles.reminder_action_button} onClick={() => openEditReminderForm(todayReminder.id)}>
                                        <img src={edit}/>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.reminder_action_button}
                                        onClick={() => openDeleteReminderForm(todayReminder.id, todayReminder.title, 'today')}
                                    >
                                        <img src={deleteIcon}/>
                                    </button>
                                </div>
                                <div className={styles.reminder_line} />
                            </div>
                        ))}

                        {selectedView === 'upcoming' && !upcomingLoading && (upcomingError || upcomingActionError) && (
                            <p className={styles.items_status}>{upcomingError || upcomingActionError}</p>
                        )}
                        {selectedView === 'upcoming' && !upcomingLoading && !upcomingError && upcomingReminders.map((upcomingReminder) => (
                            <div key={upcomingReminder.id} className={styles.reminder_item}>
                                <input
                                    type="checkbox"
                                    className={styles.reminder_checkbox}
                                    checked={upcomingReminder.completed}
                                    onChange={(event) => handleToggleReminder(upcomingReminder.id, event.target.checked, 'upcoming')}
                                />
                                <div className={styles.reminder_content}>
                                    <div className={styles.reminder_title_row}>
                                        <span className={styles.reminder_text}>{upcomingReminder.title}</span>
                                        {getPriorityImage(upcomingReminder.priority) && (
                                            <img
                                                className={styles.priority_icon}
                                                src={getPriorityImage(upcomingReminder.priority)}
                                            />
                                        )}
                                    </div>
                                    {formatReminderTime(upcomingReminder.start_at) && (
                                        <div className={styles.reminder_time}>
                                            <img src={clock} />
                                            <span>{formatReminderTime(upcomingReminder.start_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.reminder_actions}>
                                    <button
                                        type="button"
                                        className={styles.reminder_action_button}
                                        onClick={() => openEditReminderForm(upcomingReminder.id)}
                                    >
                                        <img src={edit} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.reminder_action_button}
                                        onClick={() => openDeleteReminderForm(upcomingReminder.id, upcomingReminder.title, 'upcoming')}
                                    >
                                        <img src={deleteIcon} />
                                    </button>
                                </div>
                                <div className={styles.reminder_line} />
                            </div>
                        ))}

                        {selectedView === 'folder' && folderLoading && null}
                        {selectedView === 'folder' && !folderLoading && folderError && (
                            <p className={styles.items_status}>{folderError}</p>
                        )}
                        {selectedView === 'folder' && !folderLoading && folderActionError && (
                            <p className={styles.items_status}>{folderActionError}</p>
                        )}
                        {selectedView === 'folder' && !folderLoading && !folderError && folderItems.map((folderReminder) => (
                            <div key={folderReminder.id} className={styles.reminder_item}>
                                <input
                                    type="checkbox"
                                    className={styles.reminder_checkbox}
                                    checked={folderReminder.completed}
                                    onChange={(event) => handleToggleReminder(folderReminder.id, event.target.checked, 'folder')}
                                />
                                <div className={styles.reminder_content}>
                                    <div className={styles.reminder_title_row}>
                                        <span className={styles.reminder_text}>{folderReminder.title}</span>
                                        {getPriorityImage(folderReminder.priority) && (
                                            <img className={styles.priority_icon} src={getPriorityImage(folderReminder.priority)} />
                                        )}
                                    </div>
                                    {formatReminderTime(folderReminder.start_at) && (
                                        <div className={styles.reminder_time}>
                                            <img src={clock}/>
                                            <span>{formatReminderTime(folderReminder.start_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.reminder_actions}>
                                    <button
                                        type="button"
                                        className={styles.reminder_action_button}
                                        onClick={() => openEditReminderForm(folderReminder.id)}
                                    >
                                        <img src={edit} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.reminder_action_button}
                                        onClick={() => openDeleteReminderForm(folderReminder.id, folderReminder.title, 'folder')}
                                    >
                                        <img src={deleteIcon}/>
                                    </button>
                                </div>
                                <div className={styles.reminder_line} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showForm && (
                <NewTaskForm
                    initialType={formType}
                    folderName={newReminderFolder?.title}
                    folderId={newReminderFolder?.id}
                    onClose={() => setShowForm(false)}
                    onCreateTask={handleCreateReminder}
                />
            )}
            {showFolderForm && (
                <NewFolderForm
                    initialType={formType}
                    onClose={() => setShowFolderForm(false)}
                    onCreateFolder={handleCreateFolder}
                />
            )}
            {showEditFolderForm && selectedFolder && (
                <EditFolder
                    key={selectedFolder.id}
                    title={selectedFolder.title}
                    onClose={() => setShowEditFolderForm(false)}
                    onEditFolder={handleEditFolder}
                />
            )}
            {showEditReminderForm && selectedEditReminderId !== null && (
                <EditTaskForm
                    taskID={selectedEditReminderId}
                    initialType={formType}
                    onClose={closeEditReminderForm}
                    onEditTask={handleEditReminder}
                />
            )}
            {deleteTarget && (
                <DeleteItem
                    title={deleteTarget.title}
                    onClose={() => setDeleteTarget(null)}
                    onDelete={handleDeleteReminder}
                />
            )}
            {showDeleteFolderForm && selectedFolder && (
                <DeleteItem
                    title={selectedFolder.title}
                    onClose={() => setShowDeleteFolderForm(false)}
                    onDelete={handleDeleteFolder}
                />
            )}
        </div>
    )
}

export default Reminders;