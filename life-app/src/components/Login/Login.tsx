import { useState } from 'react';
import infinityImg from '../assets/infinity.png'
import styles from './Login.module.css'
function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
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

                    <form onSubmit = {handleLogin}>
                        <div className={styles.input_section}>
                            <input 
                                placeholder="Username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            /> 
                            <input 
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            /> 
                        </div>
                    </form>
                    <button className={styles.login_button} type="submit">Login</button>
                    <h3>
                        Don't have an account?{" "}
                        <span className={styles.sign_up_link}>
                            Sign Up
                        </span>
                    </h3>
                    <h4>
                        <span className={styles.forgot_password}>
                            Forgot Password?
                        </span>
                    </h4>
                </div>
            </div>
        
          
        </div>
    )
}

export default Login;