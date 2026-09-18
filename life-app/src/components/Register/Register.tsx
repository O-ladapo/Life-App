import styles from './Register.module.css'
import infinityImg from '../assets/infinity.png'
import {useForm} from 'react-hook-form'
import { useNavigate } from 'react-router-dom';
import { registerUser } from "../../api/auth";
import { useState } from 'react';

type RegisterFormData = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}


function Register() {
    const {register, handleSubmit, watch, formState: {errors}} = useForm<RegisterFormData>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const navigate = useNavigate();

    async function handleRegister(data: RegisterFormData) {
        setErrorMessage(null);
        try {
            await registerUser({
                username: data.username,
                email: data.email,
                password: data.password
            });
        setSuccessMessage("Account created! Redirecting to login...");
        setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Registration failed");
        }
    }

    return (
        <div className={styles.register_page}>
            <div className={styles.left_section}>
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className={styles.right_section}>
                <div className={styles.right_content}>
                      <h1>Register</h1>
                      <h2>Please enter your details.</h2>
                    <form onSubmit = {handleSubmit(handleRegister)}>
                        <div className={styles.input_section}>
                            <input 
                                placeholder="Username"
                                {...register("username", {required: "Username is required"})}
                            /> 
                            {errors.username && <p className={styles.error_text}>{errors.username.message}</p>}

                            <input 
                                type="email"
                                placeholder="Email Address" 
                                {...register("email", {required: "Email is required"})}                                
                            /> 
                            {errors.email && <p className={styles.error_text}>{errors.email.message}</p>}

                            <input 
                                type="password"
                                placeholder="Password"
                                {...register("password", {required: "Password is required",
                                    minLength: {
                                        value: 4,
                                        message: "Password must be at least 4 characters long"
                                    }
                                })}
                            /> 
                            {errors.password && <p className={styles.error_text}>{errors.password.message}</p>}

                            <input 
                                type="password"
                                placeholder="Confirm Password"
                                {...register("confirmPassword", {required: "Please confirm your password",
                                    validate: (value) => value == watch("password") || "Passwords do not match"
                                })}
                            /> 
                            {errors.confirmPassword && <p className={styles.error_text}>{errors.confirmPassword.message}</p>}
                        </div>
                    
                        {errorMessage && <p className={styles.error_text}>{errorMessage}</p>}
                        {successMessage && <p className={styles.success_text}>{successMessage}</p>}

                        <button className={styles.create_account_button} type="submit"> Create Account </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default Register;