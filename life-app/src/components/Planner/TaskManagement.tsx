import styles from './TaskManagement.module.css'
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
    const [showEditTaskForm, setShowEditTaskForm] = useState(false);
    const [selectedEditTaskId, setSelectedEditTaskId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string; view: 'today' | 'upcoming' | 'folder' } | null>(null);
    const [showDeleteFolderForm, setShowDeleteFolderForm] = useState(false);
    const [newTaskFolder, setNewTaskFolder] = useState<Folder | null>(null);
    const [showEditFolderForm, setShowEditFolderForm] = useState(false);
    const [formType, setFormType] = useState<'task' | 'reminder'>('task');
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
    } = useUpcomingItemsByDate(todayStr, 'task');

    function openNewTaskForm(folder: Folder | null = null) {
        setFormType('task');
        setNewTaskFolder(folder);
        setShowForm(true);
    }

    function openNewFolderForm() {
        setFormType('task');
        setShowFolderForm(true);
    }

    function openEditFolderForm() {
        if (selectedFolder) setShowEditFolderForm(true);
    }

    function openEditTaskForm(itemId: number) {
        setSelectedEditTaskId(itemId);
        setShowEditTaskForm(true);
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

            setFolderItems(items.filter((item) => item.type === 'task' && item.folder_id === folder.id));
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
            email_reminder: data.type === 'reminder' ? data.emailReminder : false,
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

    async function handleToggleTask(itemId: number, completed: boolean, view: 'today' | 'upcoming' | 'folder') {
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
            const message = error instanceof Error ? error.message : 'Failed to update task';
            if (view === 'today') setTodayActionError(message);
            if (view === 'upcoming') setUpcomingActionError(message);
            if (view === 'folder') setFolderActionError(message);
        }
    }

    function openDeleteTaskForm(itemId: number, title: string, view: 'today' | 'upcoming' | 'folder') {
        setDeleteTarget({ id: itemId, title, view });
    }

    async function handleDeleteTask() {
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

    async function handleEditTask(data: EditTaskFormData) {
        if (selectedEditTaskId === null) return;

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
        const updatedItem = await updateItem(selectedEditTaskId, {
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

    function closeEditTaskForm() {
        setShowEditTaskForm(false);
        setSelectedEditTaskId(null);
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
                            <button className={styles.left_section_buttons} onClick={() => openNewTaskForm()}>
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
                                            className={styles.folder_add_task_button}
                                            onClick={() => openNewTaskForm(selectedFolder)}
                                        >
                                            Add Task
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.folder_add_task_button}
                                            onClick={openEditFolderForm}
                                        >
                                            Edit Folder
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.folder_add_task_button}
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
                        {selectedView === 'today' && !todayLoading && !todayError && tasks.map((todayTasks) => (
                            <div key={todayTasks.id} className={styles.task_item}>
                                <input
                                    type="checkbox"
                                    className={styles.task_checkbox}
                                    checked={todayTasks.completed}
                                    onChange={(event) => handleToggleTask(todayTasks.id, event.target.checked, 'today')}
                                />
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
                                <div className={styles.task_actions}>
                                    <button type="button" className={styles.task_action_button} onClick={() => openEditTaskForm(todayTasks.id)}>
                                        <img src={edit}/>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.task_action_button}
                                        onClick={() => openDeleteTaskForm(todayTasks.id, todayTasks.title, 'today')}
                                    >
                                        <img src={deleteIcon}/>
                                    </button>
                                </div>
                                <div className={styles.task_line} />
                            </div>
                        ))}

                        {selectedView === 'upcoming' && !upcomingLoading && (upcomingError || upcomingActionError) && (
                            <p className={styles.items_status}>{upcomingError || upcomingActionError}</p>
                        )}
                        {selectedView === 'upcoming' && !upcomingLoading && !upcomingError && upcomingTasks.map((upcomingTasks) => (
                            <div key={upcomingTasks.id} className={styles.task_item}>
                                <input
                                    type="checkbox"
                                    className={styles.task_checkbox}
                                    checked={upcomingTasks.completed}
                                    onChange={(event) => handleToggleTask(upcomingTasks.id, event.target.checked, 'upcoming')}
                                />
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
                                            <img src={clock} />
                                            <span>{formatTaskTime(upcomingTasks.start_at, upcomingTasks.end_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.task_actions}>
                                    <button
                                        type="button"
                                        className={styles.task_action_button}
                                        onClick={() => openEditTaskForm(upcomingTasks.id)}
                                    >
                                        <img src={edit} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.task_action_button}
                                        onClick={() => openDeleteTaskForm(upcomingTasks.id, upcomingTasks.title, 'upcoming')}
                                    >
                                        <img src={deleteIcon} />
                                    </button>
                                </div>
                                <div className={styles.task_line} />
                            </div>
                        ))}

                        {selectedView === 'folder' && folderLoading && null}
                        {selectedView === 'folder' && !folderLoading && folderError && (
                            <p className={styles.items_status}>{folderError}</p>
                        )}
                        {selectedView === 'folder' && !folderLoading && folderActionError && (
                            <p className={styles.items_status}>{folderActionError}</p>
                        )}
                        {selectedView === 'folder' && !folderLoading && !folderError && folderItems.map((folderTask) => (
                            <div key={folderTask.id} className={styles.task_item}>
                                <input
                                    type="checkbox"
                                    className={styles.task_checkbox}
                                    checked={folderTask.completed}
                                    onChange={(event) => handleToggleTask(folderTask.id, event.target.checked, 'folder')}
                                />
                                <div className={styles.task_content}>
                                    <div className={styles.task_title_row}>
                                        <span className={styles.task_text}>{folderTask.title}</span>
                                        {getPriorityImage(folderTask.priority) && (
                                            <img className={styles.priority_icon} src={getPriorityImage(folderTask.priority)} />
                                        )}
                                    </div>
                                    {formatTaskTime(folderTask.start_at, folderTask.end_at) && (
                                        <div className={styles.task_time}>
                                            <img src={clock}/>
                                            <span>{formatTaskTime(folderTask.start_at, folderTask.end_at)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.task_actions}>
                                    <button
                                        type="button"
                                        className={styles.task_action_button}
                                        onClick={() => openEditTaskForm(folderTask.id)}
                                    >
                                        <img src={edit} alt="Edit task" />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.task_action_button}
                                        onClick={() => openDeleteTaskForm(folderTask.id, folderTask.title, 'folder')}
                                    >
                                        <img src={deleteIcon} alt="Delete task" />
                                    </button>
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
                    folderName={newTaskFolder?.title}
                    folderId={newTaskFolder?.id}
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
            {showEditFolderForm && selectedFolder && (
                <EditFolder
                    key={selectedFolder.id}
                    title={selectedFolder.title}
                    onClose={() => setShowEditFolderForm(false)}
                    onEditFolder={handleEditFolder}
                />
            )}
            {showEditTaskForm && selectedEditTaskId !== null && (
                <EditTaskForm
                    taskID={selectedEditTaskId}
                    onClose={closeEditTaskForm}
                    onEditTask={handleEditTask}
                />
            )}
            {deleteTarget && (
                <DeleteItem
                    title={deleteTarget.title}
                    onClose={() => setDeleteTarget(null)}
                    onDelete={handleDeleteTask}
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

export default TaskManagement;