import Login from "./components/Login/Login";
import { Navigate, Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import Home from "./components/Home/Home"

function LoginPage() {
  return (
  <>
    <Login/>
  </>
  )
}

function RegisterPage() {
  return (
    <>
      <Register/>
    </>
  )
}

function ErrorPageFunction(){
  return(
    <>
      <ErrorPage/>
    </>
  )
}

function HomePage(){
  return(
    <>
      <Home/>
    </>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="*" element={<ErrorPageFunction />} />
      </Routes>
    </>
  )
}

export default App
