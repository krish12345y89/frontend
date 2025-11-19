import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Signup(){
  const { signup, refresh, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError(null);
    try {
      const res = await signup({ email, password, name });
      if (res && res.accessToken) {
        setSuccess('Signed up and logged in.');
        navigate('/');
      } else if (res && res.message) {
        setSuccess(res.message);
        navigate('/verify');
      } else {
        setError('Signup failed');
      }
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);
    try {
      const data = await refresh();
      if (data && data.accessToken) setSuccess('Access token refreshed');
      else setError('Refresh failed');
    } catch (err) { setError(err.message || String(err)); }
  }

  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    try {
      await logout();
      setSuccess('Logged out');
      navigate('/login');
    } catch (err) { setError(err.message || String(err)); }
  }

  return (
    <Container className="auth-root" sx={{ mt: 4 }}>
      <Paper className="auth-card" elevation={6} sx={{ p: 3 }}>
        <Typography variant="h5" className="auth-title">Signup</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField variant="outlined" label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField variant="outlined" label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField variant="outlined" label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          <Stack direction="row" spacing={2} className="auth-actions">
            <Button className="auth-btn auth-btn-primary" variant="contained" onClick={handleSignup}>Signup</Button>
            <Button className="auth-btn" variant="outlined" onClick={handleRefresh}>Refresh</Button>
            <Button className="auth-btn auth-btn-danger" variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
