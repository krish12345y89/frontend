import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ChatInterface from './components/ChatInterface'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import GpuAdmin from './pages/GpuAdmin'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Verify from './pages/Verify'
import { AuthProvider } from './context/AuthContext'
import './App.css' // optional extra styling for header
import { useAuth } from './context/AuthContext'

// -----------------------------
// Page Transition Wrapper
// -----------------------------
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}

// -----------------------------
// Theme Toggle Button
// -----------------------------
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="theme-toggle"
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      {dark ? '🌙' : '☀️'}
    </button>
  )
}

// -----------------------------
// Animated Route Container
// -----------------------------
function AnimatedRoutes() {
  const location = useLocation()

  return (
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <AnimatedPage>
              <Home />
            </AnimatedPage>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <ChatInterface />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <AdminDashboard />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gpu-admin"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <GpuAdmin />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AnimatedPage>
              <Login />
            </AnimatedPage>
          }
        />
        <Route
          path="/signup"
          element={
            <AnimatedPage>
              <Signup />
            </AnimatedPage>
          }
        />
        <Route
          path="/verify"
          element={
            <AnimatedPage>
              <Verify />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

// -----------------------------
// Main App Component
// -----------------------------
export default function App() {
  return (
    <BrowserRouter>
  <AuthProvider>
  <div className="app-root">
        <header className="app-header">
          <div className="logo">💬 ChatPortal</div>
          <HeaderNav />
          <ThemeToggle />
          <HeaderControls />
        </header>
        <main className="app-main">
          <AnimatedRoutes />
        </main>
      </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

function HeaderControls(){
  const { user, logout, refresh } = useAuth();
  if (!user) return null;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 12 }}>
      <div style={{ color: '#cfe8ff' }}>{user.name}</div>
      <button onClick={() => refresh()} style={{ padding: '6px 10px' }}>Refresh</button>
      <button onClick={() => logout()} style={{ padding: '6px 10px' }}>Logout</button>
    </div>
  )
}

function HeaderNav(){
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  return (
    <nav className="nav-links">
      <NavLink to="/" end>Home</NavLink>
      {isAdmin ? (
        <>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/gpu-admin">GPU Admin</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/signup">Signup</NavLink>
        </>
      )}
    </nav>
  )
}

function ProtectedRoute({ children }){
  const { user } = useAuth();
  if (!user || user.role !== 'admin'){
    return <Navigate to="/login" replace />;
  }
  return children;
}

