import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import styles from './EditItem.module.css';
import cross from '../../../assets/cross.png'
import check from '../../../assets/check.png'
import { useItemById } from '../GetItems/GetItemByID';

export type EditTaskFormData = {
    title: string;
    description?: string;
    priority: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    entireDay: boolean;
    recurrenceRule: string;
    recurrenceCustom?: number;
    emailReminder: boolean;
};

type EditTaskFormProps = {
    onClose: () => void;
    taskID: number;
    onEditTask: (data: EditTaskFormData) => Promise<void>;
};

function EditTaskForm({ onClose, taskID, onEditTask }: EditTaskFormProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        control,
        reset,
        formState: { errors },
    } = useForm<EditTaskFormData>({});
    const {
        item,
        loading,
        error,
    } = useItemById(taskID);

    useEffect(() => {
        if (!item) return;

        const startDate = item.start_at ? new Date(item.start_at) : null;
        const endDate = item.end_at ? new Date(item.end_at) : null;
        const isEntireDay = Boolean(
            startDate
            && endDate
            && startDate.getUTCHours() === 0
            && startDate.getUTCMinutes() === 0
            && endDate.getUTCHours() === 0
            && endDate.getUTCMinutes() === 0,
        );
        const formatDate = (date: Date | null) => date
            ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
            : '';
        const formatTime = (date: Date | null) => date
            ? `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
            : '';

        reset({
            title: item.title,
            description: item.description ?? '',
            priority: item.priority || 'none',
            startDate: formatDate(startDate),
            startTime: formatTime(startDate),
            endDate: formatDate(endDate),
            endTime: formatTime(endDate),
            entireDay: isEntireDay,
            recurrenceRule: item.recurrence_rule ?? 'none',
            recurrenceCustom: item.recurrence_rule_custom ?? undefined,
            emailReminder: item.email_reminder,
        });
    }, [item, reset]);

    const entireDay = useWatch({ control, name: 'entireDay' });
    const recurrenceRule = useWatch({ control, name: 'recurrenceRule' });

    if (loading) return null;
    if (error) return <div className={styles.error_text}>{error}</div>;
    if (!item) return null;

    function validateEndDateTime(): true | string {
        const values = getValues();
        const start = new Date(`${values.startDate}T${values.startTime || '00:00'}`);
        const end = new Date(`${values.endDate}T${values.endTime || '00:00'}`);

        if (entireDay) {
            return values.endDate >= values.startDate || 'End date cannot be before start date';
        }

        return end >= start || 'End time cannot be before start time';
    }

    async function handleEditTask(data: EditTaskFormData) {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await onEditTask({ ...data });
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to edit item');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.modal_overlay}>
            <form
                className={styles.modal_box}
                onSubmit={handleSubmit(handleEditTask)}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modal_header}>
                    <span className={styles.modal_close} onClick={onClose}><img src={cross} width="34" height="34"/></span>

                    <h2 className={styles.modal_title}>Edit</h2>

                    <button type="submit" className={styles.confirm_button} disabled={isSubmitting}>
                        <img src={check} width="34" height="44"/>
                    </button>
                </div>

                {submitError && <p className={styles.error_text}>{submitError}</p>}

                <div className={styles.info_section}>
                    <input
                        className={styles.title_input}
                        placeholder="Title"
                        {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && <p className={styles.error_text}>{errors.title.message}</p>}

                    <textarea
                        className={styles.description_input}
                        placeholder="Description"
                        {...register('description')}
                    />
                </div>

                <div className={styles.row_section}>
                    <label>Priority</label>
                    <select {...register('priority')} className={styles.box_select}>
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className={styles.date_section}>
                    <div className={styles.row_section}>
                        <label>Entire-day</label>
                        <label className={styles.switch}>
                            <input type="checkbox" {...register('entireDay')} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.row_section}>
                        <label>Starts</label>
                        <div className={styles.datetime_group}>
                            <input
                                type="date"
                                className={styles.box_input}
                                {...register('startDate', {
                                    required: 'Start date is required',
                                })}
                            />
                            {errors.startDate && <p className={styles.error_text}>{errors.startDate.message}</p>}
                            {!entireDay && <input type="time" className={styles.box_input} {...register('startTime')} />}
                        </div>
                    </div>

                    <div className={styles.row_section}>
                        <label>Ends</label>
                        <div className={styles.datetime_group}>
                            <input
                                type="date"
                                className={styles.box_input}
                                {...register('endDate', {
                                    required: 'End date is required',
                                    validate: validateEndDateTime,
                                })}
                            />
                            {errors.endDate && <p className={styles.error_text}>{errors.endDate.message}</p>}
                            {!entireDay && (
                                <input
                                    type="time"
                                    className={styles.box_input}
                                    {...register('endTime', { validate: validateEndDateTime })}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.row_section}>
                        <label>Recurring</label>
                        <select {...register('recurrenceRule')} className={styles.box_select}>
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    {recurrenceRule === 'custom' && (
                        <div className={styles.row_section}>
                            <label>Repeat every</label>
                            <div className={styles.datetime_group}>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 3"
                                    className={styles.box_input}
                                    {...register('recurrenceCustom', {
                                        valueAsNumber: true,
                                        required: recurrenceRule === 'custom' ? 'Please enter a number of days' : false,
                                        min: { value: 1, message: 'Must be at least 1 day' },
                                    })}
                                />
                                <span className={styles.unit_label}>days</span>
                            </div>
                        </div>
                    )}
                    {errors.recurrenceCustom && (
                        <p className={styles.error_text}>{errors.recurrenceCustom.message}</p>
                    )}

                    {item.type === 'reminder' && (
                        <div className={styles.row_section}>
                            <label>Email Reminder</label>
                            <label className={styles.switch}>
                                <input type="checkbox" {...register('emailReminder')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

export default EditTaskForm;