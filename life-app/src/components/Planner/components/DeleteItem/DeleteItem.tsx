import { useState } from 'react';
import styles from './DeleteItem.module.css';
import cross from '../../../assets/cross.png';
import check from '../../../assets/check.png';

type DeleteItemProps = {
    title: string;
    onClose: () => void;
    onDelete: () => Promise<void>;
};

function DeleteItem({ title, onClose, onDelete }: DeleteItemProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function handleDelete() {
        if (isDeleting) return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await onDelete();
            onClose();
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Failed to delete item');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className={styles.modal_overlay}>
            <div className={styles.modal_box}>
                <div className={styles.modal_header}>
                    <button type="button" className={styles.modal_close} onClick={onClose}>
                        <img src={cross} width="34" height="34" alt="Cancel" />
                    </button>
                    <h2 className={styles.modal_title}>Delete</h2>
                    <button type="button" className={styles.confirm_button} onClick={handleDelete} disabled={isDeleting}>
                        <img src={check} width="34" height="44" alt="Confirm delete" />
                    </button>
                </div>

                <p className={styles.delete_message}>Delete &quot;{title}&quot;?</p>
                {deleteError && <p className={styles.error_text}>{deleteError}</p>}
            </div>
        </div>
    );
}

export default DeleteItem;