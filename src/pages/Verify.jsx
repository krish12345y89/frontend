import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Verify(){
  const { verifyOtp, refresh, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const tokenFromState = location.state?.token || '';
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(tokenFromState);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleVerify = async () => {
    setError(null);
    try {
      const res = await verifyOtp({ email, otp, token });
      if (res && res.accessToken) {
        navigate('/');
      } else {
        setError(res.message || 'Verification failed');
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
      if (data && data.accessToken) {
        setInfo('Access token refreshed');
      } else {
        setError('Refresh failed');
      }
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  const handleLogout = async () => {
    setError(null);
    setInfo(null);
    try {
      await logout();
      setInfo('Logged out');
      navigate('/login');
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <Container className="auth-root" sx={{ mt: 4 }}>
      <Paper className="auth-card" elevation={6} sx={{ p: 3 }}>
        <Typography variant="h5" className="auth-title">Verify OTP</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}
          <TextField variant="outlined" label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField variant="outlined" label="OTP" fullWidth value={otp} onChange={(e) => setOtp(e.target.value)} />
          <TextField variant="outlined" label="Token (if provided)" fullWidth value={token} onChange={(e) => setToken(e.target.value)} />
          <Stack direction="row" spacing={2} className="auth-actions">
            <Button className="auth-btn auth-btn-primary" variant="contained" onClick={handleVerify}>Verify</Button>
            <Button className="auth-btn" variant="outlined" onClick={handleRefresh}>Refresh</Button>
            <Button className="auth-btn auth-btn-danger" variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
