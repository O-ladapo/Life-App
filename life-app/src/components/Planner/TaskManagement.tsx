import styles from './TaskManagement.module.css'
import PlannerNavbar from '../Navbars/Planner_navbar';

function TaskManagement() {
    
    return (
        <div className={styles.TaskManagement}>
            <PlannerNavbar />
            <div className={styles.task_layout}>
                <div className={styles.card}>
                    <div className={styles.right_section}>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default TaskManagement;