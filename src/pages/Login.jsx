import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const { login, refresh, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await login({ email, password });
      if (res && res.message && res.message.includes('OTP')) {
        setInfo('OTP sent to your email. Check your inbox and verify.');
        // pass email and token (if provided) to verify page
        const token = res.token || res.tokenValue || res.tokenString || null;
        navigate('/verify', { state: { email, token } });
      } else {
        setError('Login failed');
      }
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
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Login</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}
          <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleLogin}>Login</Button>
            <Button variant="outlined" onClick={handleRefresh}>Refresh</Button>
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
