import { useState } from 'react';
import infinityImg from '../assets/infinity.png'
import styles from './Login.module.css'
import {useForm} from 'react-hook-form'
import { Link } from 'react-router-dom';

type LoginFormData = {
    username: string;
    password: string;
}

function Login() {
    const {register, handleSubmit, formState: {errors}} = useForm<LoginFormData>();
    

    function handleLogin(data: LoginFormData) {
        alert("Logged in successfully!" + data.username);
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
                        <button className={styles.login_button} type="submit">Login</button>
                    </form>
                    <h3>
                        Don't have an account?{" "}
                        <Link to= '/register' className={styles.sign_up_link}>
                            Sign Up
                        </Link>
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