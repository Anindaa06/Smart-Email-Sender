import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import useAuth from './hooks/useAuth'
import useToast from './hooks/useToast'
import Spinner from './components/ui/Spinner'
import Toast from './components/ui/Toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Compose from './pages/Compose'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

const PrivateRoute = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <Spinner fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const RouterContent = () => {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/compose" element={<PrivateRoute><Compose /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
