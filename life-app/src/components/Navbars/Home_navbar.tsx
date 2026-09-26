import { useState, useRef, useEffect } from 'react';
import { Link , useNavigate} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './Home_navbar.module.css'
import infinityImg from '../assets/infinity.png'
import cross from '../assets/cross.png'
import userImg from '../assets/user.png'
import { requestPasswordReset } from '../../api/auth';

type TokenPayload = {
    user_id: number;
    username: string;
    email: string;
    exp: number;
};

function HomeNavbar () {
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [resetError, setResetError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const [username] = useState(() => {
        const token = localStorage.getItem('token');
        if (!token) return '';
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            return decoded.username ?? '';
        } catch (err) {
            console.error('Failed to decode token', err);
            return '';
        }
    });

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
                <Link to="/home" className={styles.logo}>
                    <img src={infinityImg} width="100" height="70"/>
                </Link>
                <div className={styles.username}>
                    <h1> Hello {username} </h1>
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

export default HomeNavbar;