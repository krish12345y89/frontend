import React from 'react'
import { NavLink } from 'react-router-dom'
import './Home.css'

export default function Home(){
  return (
    <div className="home-root">
      {/* Floating background elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      
      <div className="home-card">
        <h1 className="home-title">Welcome to Inferia</h1>
        <p className="home-lead">
          Inferia is a cutting-edge platform for managing GPU resources and interacting with AI models. 
          Explore chat interfaces, manage infrastructure, and monitor workloads from a single, powerful dashboard.
        </p>

        <div className="home-cta">
          <NavLink className="btn-primary" to="/chat">🚀 Open Chat</NavLink>
          <NavLink className="btn-secondary" to="/admin">⚙️ Admin Dashboard</NavLink>
          <NavLink className="btn-secondary" to="/gpu-admin">🎮 GPU Admin</NavLink>
          <NavLink className="btn-secondary" to="/login">🔐 Login</NavLink>
          <NavLink className="btn-secondary" to="/signup">📝 Signup</NavLink>
        </div>

        <section className="home-about">
          <h3>🚀 About this Platform</h3>
          <p>
            Built with React + Vite, Inferia centralizes model access, deployment controls, 
            and observability for GPU workloads. Use the GPU Admin to view machine status 
            and the Chat interface to interact with hosted AI models in real-time.
          </p>
        </section>
      </div>
    </div>
  )
}