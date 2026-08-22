import infinityImg from './assets/infinity.png'
import './Login.css'
function Login() {
    return (
        <div className="login_page">
            <div className="left_section">
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className="right_section">
                <div className="right_content">
                    <div>
                      <h1>Login</h1>
                      <h2>Welcome back! Please sign in to continue.</h2>
                    </div>
                
                    <div className="input_section">
                        <input placeholder="Username" /> 
                        <input type="password" placeholder="Password" /> 
                    </div>
                    <div className="login_button">
                        <button type="submit">Login</button>
                    </div>
                </div>
            </div>
        
          
        </div>
    )
}

export default Login;