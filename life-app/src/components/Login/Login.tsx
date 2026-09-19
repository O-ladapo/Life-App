import { useState } from 'react';
import infinityImg from '../assets/infinity.png'
import cross from '../assets/cross.png'
import styles from './Login.module.css'
import {useForm} from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import { requestPasswordReset } from '../../api/auth';

type LoginFormData = {
    username: string;
    password: string;
}

function Login() {
    const {register, handleSubmit, formState: {errors}} = useForm<LoginFormData>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [resetError, setResetError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
   
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    

    async function handleLogin(data: LoginFormData) {
        setErrorMessage(null);
        const token = searchParams.get("token");
        try {
            const response = await loginUser({
                username: data.username,
                password: data.password,
                token: token ?? "" 
            });
        localStorage.setItem("token", response.token);
        navigate('/home');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Login failed");
        }
    }

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

    return (
        <div className={styles.login_page}>
            <div className={styles.left_section}>
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className={styles.right_section}>
                <div className={styles.right_content}>
                      <h1>Login</h1>
                      <h2>Welcome back! Please sign in to continue.</h2>

                    <form onSubmit = {handleSubmit(handleLogin)}>
                        <div className={styles.input_section}>
                            <input 
                                placeholder="Username" 
                                {...register("username", {required: "Username is required"})}
                            /> 
                            {errors.username && <p className={styles.error_text}>{errors.username.message} </p>}

                            <input 
                                type="password"
                                placeholder="Password"
                                {...register("password", {required: "Password is required"})}
                            /> 
                            {errors.password && <p className={styles.error_text}>{errors.password.message}</p>}

                        </div>

                        {errorMessage && <p className={styles.error_text}>{errorMessage}</p>}

                        <button className={styles.login_button} type="submit">Login</button>
                    </form>
                    <h3>
                        Don't have an account?{" "}
                        <Link to= '/register' className={styles.sign_up_link}>
                            Sign Up
                        </Link>
                    </h3>
                    <h4>
                        <span 
                            className={styles.forgot_password}
                            onClick={() => setShowForgotPassword(true)}>
                            Forgot Password?
                        </span>
                    </h4>
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
        </div>
    )
}

export default Login;