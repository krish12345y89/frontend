import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const { login, refresh, logout, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await login({ email, password });

      // Normalize possible token locations
      const token = res?.token || res?.tokenValue || res?.tokenString || res?.accessToken || res?.response?.token || res?.response?.tokenValue || res?.response?.tokenString || res?.response?.accessToken || null;

      const message = (res && (res.message || res.response?.message || JSON.stringify(res))) || '';

      // Determine if server expects OTP verification
      const expectsOtp = /otp|verify|verification|one[- ]time/i.test(message) || res?.requiresOtp || res?.response?.requiresOtp || res?.otpRequired || res?.response?.otpRequired;

      if (expectsOtp) {
        setInfo('OTP sent to your email. Check your inbox and verify.');
        navigate('/verify', { state: { email, token } });
        return;
      }

      // If login returned an access token, treat as success
      if (res && (res.accessToken || res.token || res.response?.accessToken)) {
        // try to set user if provided
        if (res.user) setUser(res.user);
        setInfo('Logged in');
        navigate('/');
        return;
      }

      // Fallback: if response includes success true and no token required, accept login
      if (res && (res.success === true || res.ok === true)) {
        if (res.user) setUser(res.user);
        setInfo('Logged in');
        navigate('/');
        return;
      }

      // Otherwise show server message if present, else generic error
      setError((res && (res.message || res.response?.message)) || 'Login failed');
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  const handleRefresh = async () => {
    setError(null);
    setInfo(null);
    try {
      const data = await refresh();
      if (data && data.accessToken) setInfo('Access token refreshed');
      else setError('Refresh failed');
    } catch (err) { setError(err.message || String(err)); }
  }

  const handleLogout = async () => {
    setError(null);
    setInfo(null);
    try {
      await logout();
      setInfo('Logged out');
      navigate('/login');
    } catch (err) { setError(err.message || String(err)); }
  }

  return (
    <Container className="auth-root" sx={{ mt: 4 }}>
      <Paper className="auth-card" elevation={6} sx={{ p: 3 }}>
        <Typography variant="h5" className="auth-title">Login</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}
          <TextField variant="outlined" label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField variant="outlined" label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          <Stack direction="row" spacing={2} className="auth-actions">
            <Button className="auth-btn auth-btn-primary" variant="contained" onClick={handleLogin}>Login</Button>
            <Button className="auth-btn" variant="outlined" onClick={handleRefresh}>Refresh</Button>
            <Button className="auth-btn auth-btn-danger" variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
