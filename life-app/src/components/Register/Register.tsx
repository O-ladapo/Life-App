import styles from './Register.module.css'
import infinityImg from '../assets/infinity.png'
import {useForm} from 'react-hook-form'

type RegisterFormData = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}


function Register() {
    const {register, handleSubmit, watch, formState: {errors}} = useForm<RegisterFormData>();

    function handleRegister(data: RegisterFormData) {
        alert("Account created successfully!" + data.username + " " + data.email);
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
                                    },
                                    maxLength: {
                                        value: 12,
                                        message: "Password cannot exceed 12 characters"
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
                        <button className={styles.create_account_button} type="submit">Create Account</button>
                    </form>
                </div>
            </div>
        
          
        </div>
    )
}
export default Register;