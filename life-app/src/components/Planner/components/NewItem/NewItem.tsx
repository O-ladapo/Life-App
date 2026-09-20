import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styles from './NewItem.module.css';
import cross from '../../../assets/cross.png'
import check from '../../../assets/check.png'

export type NewTaskFormData = {
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

type NewTaskFormProps = {
    onClose: () => void;
    initialType: 'task' | 'reminder';
    onCreateTask: (data: NewTaskFormData & { type: 'task' | 'reminder' }) => Promise<void>;
};

function NewTaskForm({ onClose, initialType, onCreateTask }: NewTaskFormProps) {
    const [itemType, setItemType] = useState<'task' | 'reminder'>(initialType);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        getValues,
        watch,
        formState: { errors },
    } = useForm<NewTaskFormData>({
        defaultValues: {
            priority: 'none',
            entireDay: false,
            recurrenceRule: 'none',
            emailReminder: false,
        },
    });

    const entireDay = watch('entireDay');
    const recurrenceRule = watch('recurrenceRule');

    function validateEndDateTime(): true | string {
        const values = getValues();
        const start = new Date(`${values.startDate}T${values.startTime || '00:00'}`);
        const end = new Date(`${values.endDate}T${values.endTime || '00:00'}`);

        if (entireDay) {
            return values.endDate >= values.startDate || 'End date cannot be before start date';
        }

        return end >= start || 'End time cannot be before start time';
    }

    async function handleCreateTask(data: NewTaskFormData) {
        setSubmitError(null);

        try {
            await onCreateTask({ ...data, type: itemType });
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to create item');
        }
    }

    return (
        <div className={styles.modal_overlay}>
            <form
                className={styles.modal_box}
                onSubmit={handleSubmit(handleCreateTask)}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modal_header}>
                    <span className={styles.modal_close} onClick={onClose}><img src={cross} width="34" height="34"/></span>

                    <div className={styles.type_toggle}>
                        <button
                            type="button"
                            className={itemType === 'task' ? `${styles.toggle_button} ${styles.active}` : styles.toggle_button}
                            onClick={() => setItemType('task')}
                        >
                            Task
                        </button>
                        <button
                            type="button"
                            className={itemType === 'reminder' ? `${styles.toggle_button} ${styles.active}` : styles.toggle_button}
                            onClick={() => setItemType('reminder')}
                        >
                            Reminder
                        </button>
                    </div>

                    <button type="submit" className={styles.confirm_button}><img src={check} width="34" height="44"/></button>
                </div>

                <h2 className={styles.modal_title}>New</h2>

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

                    {itemType === 'reminder' && (
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

export default NewTaskForm;