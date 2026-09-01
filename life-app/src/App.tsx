import Login from "./components/Login/Login";
import { Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import ErrorPage from "./components/ErrorPage/ErrorPage";

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

function App() {

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<ErrorPageFunction />} />
      </Routes>
    </>
  )
}

export default App
