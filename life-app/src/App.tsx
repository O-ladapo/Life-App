import Login from "./components/Login/Login";
import { Navigate, Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import Home from "./components/Home/Home"
import PasswordResetPage from "./components/PasswordResetPage/PasswordResetPage";
import Dashboard from "./components/Planner/Dashboard";
import TaskManagement from "./components/Planner/TaskManagement";

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
        <Route path="/" element={<Login />} />
        <Route path="/verify" element={<Login />} />
        <Route path="/verify-password" element={<PasswordResetPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/planner/tasks" element={<ProtectedRoute><TaskManagement /></ProtectedRoute>} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  )
}

export default App
