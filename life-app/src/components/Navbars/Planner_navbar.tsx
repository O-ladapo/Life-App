import { useState, useRef, useEffect } from 'react';
import { Link , useNavigate, NavLink} from 'react-router-dom';
import styles from './Planner_navbar.module.css'
import infinityImg from '../assets/infinity.png'
import cross from '../assets/cross.png'
import userImg from '../assets/user.png'
import { requestPasswordReset } from '../../api/auth';


function PlannerNavbar () {
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [resetError, setResetError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    async function handleSendResetLink () {
        setResetMessage(null);
        setResetError(null);
        if (!resetEmail) {
            setResetError("Please enter your email address");
            return;
        }

        try {
            await requestPasswordReset(resetEmail);
            setResetMessage("If that email exists, a reset link has been sent.");
        } catch (err) {
            setResetError(err instanceof Error ? err.message : "Something went wrong");
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        navigate('/');
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar_container}>
                <div className={styles.navbar_left}>
                    <Link to="/home" className={styles.logo}>
                        <img src={infinityImg} width="100" height="70"/>
                    </Link>
                    <div className={styles.title}>
                        <h1> Planner </h1>
                    </div>
                </div>
                <div className={styles.navbar_center}>
                    <NavLink to='/planner' end className={({ isActive }) => isActive ? `${styles.navbar_pages} ${styles.active}` : styles.navbar_pages}>Dashboard</NavLink>
                    <NavLink to='/planner/tasks'className={({ isActive }) => isActive ? `${styles.navbar_pages} ${styles.active}` : styles.navbar_pages}>Task Management</NavLink>
                    <NavLink to='/planner/reminders'className={({ isActive }) => isActive ? `${styles.navbar_pages} ${styles.active}` : styles.navbar_pages}>Reminders</NavLink>
                    <NavLink to='/planner/calendar'className={({ isActive }) => isActive ? `${styles.navbar_pages} ${styles.active}` : styles.navbar_pages}>Calendar</NavLink>
                </div>
                <div className={styles.settings_icon} onClick={() => setShowSettings(!showSettings)} ref={menuRef}>
                    <img src={userImg} width="51" height="51"/>
                    {showSettings && (
                        <div className={styles.settings_dropdown_menu}>
                            <button className={styles.dropdown_item} onClick={() => setShowForgotPassword(true)}>Reset Password</button>
                            <button className={styles.dropdown_item} onClick={() => handleLogout()}>Log Out</button>
                        </div>
                    )}
                </div>
            </div>
            {showForgotPassword && (
            <div className={styles.modal_overlay} onClick={() => setShowForgotPassword(false)}>
                <div className={styles.modal_box} onClick={(e) => e.stopPropagation()}>
                    <h2>Reset your password</h2>
                    <p>Enter your email and we'll send you a reset link.</p>
                    <input 
                        type="email" 
                        placeholder="Email address" 
                        className={styles.modal_input}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)} />
                    {resetError && <p className={styles.error_text}>{resetError}</p>}
                    {resetMessage && <p className={styles.success_text}>{resetMessage}</p>}
                    <button className={styles.modal_button} onClick={handleSendResetLink}>Send Reset Link</button>
                    <span 
                        className={styles.modal_close} 
                        onClick={() => setShowForgotPassword(false)}>
                        <img src={cross} width="34" height="34"/>
                    </span>
                </div>
            </div>
            )}
        </nav>
    )
}

export default PlannerNavbar;