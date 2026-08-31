import './Register.css'
import infinityImg from '../assets/infinity.png'
import {useForm} from 'react-hook-form'

type RegisterFormData = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}


function Register() {
    const {register, handleSubmit} = useForm<RegisterFormData>();

    function handleRegister(data: RegisterFormData) {
        alert("Account created successfully!" + data.username + " " + data.email);
    }

    return (
        <div className="login_page">
            <div className="left_section">
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className="right_section">
                <div className="right_content">
                      <h1>Register</h1>
                      <h2>Please enter your details.</h2>
                    <form onSubmit = {handleSubmit(handleRegister)}>
                        <div className="input_section">
                            <input 
                                placeholder="Username"
                                {...register("username")}
                            /> 
                            <input 
                                type="email"
                                placeholder="Email Address" 
                                {...register("email")}
                            /> 
                            <input 
                                type="password"
                                placeholder="Password"
                                {...register("password")}
                            /> 
                            <input 
                                type="password"
                                placeholder="Confirm Password"
                                {...register("confirmPassword")}
                            /> 
                        </div>
                        <button className="create_account_button" type="submit">Create Account</button>
                    </form>
                </div>
            </div>
        
          
        </div>
    )
}
export default Register;