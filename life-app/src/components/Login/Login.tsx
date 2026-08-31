import { useState } from 'react';
import infinityImg from '../assets/infinity.png'
import './Login.css'
function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <div className="login_page">
            <div className="left_section">
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className="right_section">
                <div className="right_content">
                      <h1>Login</h1>
                      <h2>Welcome back! Please sign in to continue.</h2>

                    <form onSubmit = {handleLogin}>
                        <div className="input_section">
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
                    <button className="login_button" type="submit">Login</button>
                    <h3>
                        Don't have an account?{" "}
                        <span className="sign_up_link">
                            Sign Up
                        </span>
                    </h3>
                    <h4>
                        <span className="forgot_password">
                            Forgot Password?
                        </span>
                    </h4>
                </div>
            </div>
        
          
        </div>
    )
}

export default Login;