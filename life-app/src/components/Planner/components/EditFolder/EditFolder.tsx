import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styles from './EditFolder.module.css';
import cross from '../../../assets/cross.png';
import check from '../../../assets/check.png';

export type EditFolderFormData = {
    title: string;
};

type EditFolderProps = {
    title: string;
    onClose: () => void;
    onEditFolder: (data: EditFolderFormData) => Promise<void>;
};

function EditFolder({ title, onClose, onEditFolder }: EditFolderProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors } } = useForm<EditFolderFormData>({
        defaultValues: { title },
    });

    async function handleEditFolder(data: EditFolderFormData) {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await onEditFolder(data);
            onClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to edit folder');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.modal_overlay}>
            <form
                className={styles.modal_box}
                onSubmit={handleSubmit(handleEditFolder)}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modal_header}>
                    <span className={styles.modal_close} onClick={onClose}>
                        <img src={cross} width="34" height="34" alt="Cancel" />
                    </span>
                    <h2 className={styles.modal_title}>Edit Folder</h2>
                    <button type="submit" className={styles.confirm_button} disabled={isSubmitting}>
                        <img src={check} width="34" height="44" alt="Save" />
                    </button>
                </div>

                {submitError && <p className={styles.error_text}>{submitError}</p>}
                <div className={styles.info_section}>
                    <input
                        className={styles.title_input}
                        placeholder="Title"
                        {...register('title', { required: 'Folder title is required' })}
                    />
                    {errors.title && <p className={styles.error_text}>{errors.title.message}</p>}
                </div>
            </form>
        </div>
    );
}

export default EditFolder;
