import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styles from './NewFolder.module.css';
import cross from '../../../assets/cross.png'
import check from '../../../assets/check.png'

export type NewFolderFormData = {
    title: string;
};

type NewFolderFormProps = {
    onClose: () => void;
    initialType: 'task' | 'reminder';
    onCreateFolder: (data: NewFolderFormData & { type: 'task' | 'reminder' }) => Promise<void>;
};

function NewFolderForm({ onClose, initialType, onCreateFolder }: NewFolderFormProps) {
    const [itemType, setItemType] = useState<'task' | 'reminder'>(initialType);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<NewFolderFormData>({});


    async function handleCreateFolder(data: NewFolderFormData) {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await onCreateFolder({ ...data, type: itemType });
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to create folder');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.modal_overlay}>
            <form
                className={styles.modal_box}
                onSubmit={handleSubmit(handleCreateFolder)}
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

                    <button type="submit" className={styles.confirm_button} disabled={isSubmitting}>
                        <img src={check} width="34" height="44"/>
                    </button>
                </div>

                <h2 className={styles.modal_title}>New Folder</h2>

                {submitError && <p className={styles.error_text}>{submitError}</p>}

                <div className={styles.info_section}>
                    <input
                        className={styles.title_input}
                        placeholder="Title"
                        {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && <p className={styles.error_text}>{errors.title.message}</p>}
                </div>
            </form>
        </div>
    );
}

export default NewFolderForm;