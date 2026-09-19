import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendPassword } from '../../api/auth';
import infinityImg from '../assets/infinity.png'
import styles from './PasswordResetPage.module.css'

type PaasswordResetFormData = {
    password: string;
    confirmPassword: string;
}


function PasswordResetPageFunction() {
    const {register, handleSubmit, watch, formState: {errors}} = useForm<PaasswordResetFormData>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    async function handlePasswordReset (data: PaasswordResetFormData){
        setErrorMessage(null);
        const token = searchParams.get("token");
        if (!token){
            return
        }
        try {
            await sendPassword({
                password: data.password,
                token: token
            });
        setSuccessMessage("Password reset successful, taking you to login...");
        setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Password Reset failed");
        }
    }

    return (
        <div className={styles.password_reset_page}>
            <div className={styles.left_section}>
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className={styles.right_section}>
                <div className={styles.right_content}>
                      <h1>Reset Your Password</h1>
                    <form onSubmit = {handleSubmit(handlePasswordReset)}>
                        <div className={styles.input_section} >
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

                        <button className={styles.submit_button} type="submit"> Submit</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default PasswordResetPageFunction;