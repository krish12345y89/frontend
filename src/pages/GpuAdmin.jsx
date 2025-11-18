import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Grid, Box, Alert } from '@mui/material';
const API_BASE = import.meta.env.VITE_API_URL || 'http://llmapi.inferia.ai/api4000';
import './GpuAdmin.css';
export default function GpuAdmin() {
  const [gpusResp, setGpusResp] = useState(null);
  const [gpusForm, setGpusForm] = useState({ model: '', budgetPerHour: '', requiredVram: '', gpuName: '', duration: 1 });
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [customDeployResp, setCustomDeployResp] = useState(null);
  const [customDeployBody, setCustomDeployBody] = useState(JSON.stringify({
    model: 'deepseek-r1:7b',
    gpuConfig: {
      success: true,
      model: 'tinyllama',
      parameters: '7.0B',
      gpuCount: 1,
      gpuModel: 'NVIDIA 3090',
      requiredVram: '6GB',
      pricePerHour: 0.07,
      memoryUtilization: '75%'
    }
  }, null, 2));
  const [customModel, setCustomModel] = useState('');
  const [customDockerImage, setCustomDockerImage] = useState('');
  const [customEnvText, setCustomEnvText] = useState('');
  const [customDuration, setCustomDuration] = useState(1);
  const [customAutoExtend, setCustomAutoExtend] = useState(false);
  const [message, setMessage] = useState(null);
  const [closeResp, setCloseResp] = useState(null);
  const [closeJobId, setCloseJobId] = useState('');
  const [deploymentResp, setDeploymentResp] = useState(null);
  const [deploymentId, setDeploymentId] = useState('');
  const [networkResp, setNetworkResp] = useState(null);
  const [logsResp, setLogsResp] = useState(null);
  const [logsIpfs, setLogsIpfs] = useState('');
  const [healthResp, setHealthResp] = useState(null);
  const [deploymentsUser, setDeploymentsUser] = useState(null);
  const [deploymentsAll, setDeploymentsAll] = useState(null);
  const [deploymentsNosana, setDeploymentsNosana] = useState(null);
  const [deploymentsSummary, setDeploymentsSummary] = useState(null);
  const [error, setError] = useState(null);

  const callGpus = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gpus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpusForm),
        credentials: 'include'
      });
      const data = await res.json();
      setGpusResp(data);
      // clear selection on new results
      setSelectedGpu(null);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callCustomDeploy = async () => {
    setError(null);
    try {
      const body = JSON.parse(customDeployBody);
      // attach duration and autoExtend if provided
      if (!body.duration) body.duration = customDuration || 1;
      if (!body.config) body.config = {};
      body.config.autoExtend = !!customAutoExtend;
      const res = await fetch(`${API_BASE}/custom-deploy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include'
      });
      const data = await res.json();
      setCustomDeployResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callCustomDeployWithSelected = async () => {
    setError(null);
    if (!selectedGpu) {
      setError('No GPU selected. Select a GPU from /gpus first.');
      return;
    }
    try {
      // build payload
      const payload = {
        model: customModel || gpusForm.model || (selectedGpu.gpuConfig && selectedGpu.gpuConfig.model) || undefined,
        gpuConfig: selectedGpu.gpuConfig,
        dockerImage: customDockerImage,
        duration: customDuration || gpusForm.duration || 1,
        config: { autoExtend: !!customAutoExtend }
      };

      // attach env parsed from customEnvText under gpuConfig.env
      const env = {};
      customEnvText.split('\n').forEach((line) => {
        const t = line.trim(); if (!t) return;
        const idx = t.indexOf('='); if (idx === -1) return;
        const k = t.slice(0, idx).trim(); const v = t.slice(idx+1).trim(); if (k) env[k] = v;
      });
      if (Object.keys(env).length > 0) payload.gpuConfig = { ...payload.gpuConfig, env };

      const res = await fetch(`${API_BASE}/custom-deploy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include'
      });
      const data = await res.json();
      setCustomDeployResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callClose = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/close`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: closeJobId }), credentials: 'include'
      });
      const data = await res.json();
      setCloseResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callGetDeployment = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployment/${deploymentId}`, { credentials: 'include' });
      const data = await res.json();
      setDeploymentResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callNetworkStatus = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/network-status`, { credentials: 'include' });
      const data = await res.json();
      setNetworkResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callGetLogs = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/getLogs?ipfs=${encodeURIComponent(logsIpfs)}`, { credentials: 'include' });
      const data = await res.json();
      setLogsResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callHealth = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
      const data = await res.json();
      setHealthResp(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const callDeploymentsUser = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployments/user`, { credentials: 'include' });
      const data = await res.json();
      setDeploymentsUser(data);
    } catch (err) { setError(err.message || String(err)); }
  };

  const callDeploymentsAll = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployments/all`, { credentials: 'include' });
      const data = await res.json();
      setDeploymentsAll(data);
    } catch (err) { setError(err.message || String(err)); }
  };

  const callDeploymentsAllNosana = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployments/all/nosana`, { credentials: 'include' });
      const data = await res.json();
      setDeploymentsNosana(data);
    } catch (err) { setError(err.message || String(err)); }
  };

  const callDeploymentsStatusSummary = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployments/status-summary`, { credentials: 'include' });
      const data = await res.json();
      setDeploymentsSummary(data);
    } catch (err) { setError(err.message || String(err)); }
  };

  const enableAutoExtend = async (deploymentId) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/deployments/autoextend/${encodeURIComponent(deploymentId)}`, {
        method: 'POST', credentials: 'include'
      });
      const data = await res.json();
      // update UI: re-fetch user deployments
      await callDeploymentsUser();
      return data;
    } catch (err) { setError(err.message || String(err)); }
  };

  return (
    <Container className="gpu-admin-root" sx={{ mt: 4, mb: 8 }}>
      <div className="page-header">
        <div>
          <div className="page-title"><Typography variant="h4" component="span">GPU Admin</Typography></div>
          <div className="page-subtitle"><Typography variant="body2" component="span">Manage GPU marketplace, deployments and health checks</Typography></div>
        </div>
        <div className="page-actions">
          <div className="chip">Env: dev</div>
          <Button className="btn-ghost">Export</Button>
          <Button className="btn-primary">New Deployment</Button>
        </div>
      </div>
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3} className="gpu-grid">
        {/* Search GPUs Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel gpu-search-panel" sx={{ p: 2 }}>
            <div className="panel-header">
              <Typography variant="subtitle1">Search GPUs</Typography>
              <div className="panel-actions"><div className="small muted">filters</div></div>
            </div>
            <div className="panel-content">
              <TextField label="Model" fullWidth value={gpusForm.model} onChange={(e) => setGpusForm({...gpusForm, model: e.target.value})} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="Budget Per Hour" fullWidth value={gpusForm.budgetPerHour} onChange={(e) => setGpusForm({...gpusForm, budgetPerHour: e.target.value})} />
                <TextField label="Required VRAM" fullWidth value={gpusForm.requiredVram} onChange={(e) => setGpusForm({...gpusForm, requiredVram: e.target.value})} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="GPU Name" fullWidth value={gpusForm.gpuName} onChange={(e) => setGpusForm({...gpusForm, gpuName: e.target.value})} />
                <TextField label="Duration (hours)" fullWidth type="number" value={gpusForm.duration} onChange={(e) => setGpusForm({...gpusForm, duration: parseInt(e.target.value) || 1})} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button className="btn-primary" onClick={callGpus}>Search</Button>
                <Button className="btn-ghost" onClick={() => { setGpusResp(null); setSelectedGpu(null); }}>Clear</Button>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* GPU Results Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel gpu-results-panel" sx={{ p: 2 }}>
            <div className="panel-header">
              <Typography variant="subtitle1">GPU Results</Typography>
              <div className="panel-actions"><div className="small muted">{gpusResp?.gpus?.length || 0} results</div></div>
            </div>
            <div className="panel-content">
              {gpusResp?.gpus && gpusResp.gpus.length > 0 ? (
                <Box>
                  {gpusResp.gpus.map((g, i) => (
                    <Paper key={i} className={`gpu-card selectable ${selectedGpu === g ? 'selected' : ''}`} sx={{ p: 2, mb: 2 }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={8} className="left">
                          <Typography variant="h6"><strong>{g.gpuConfig?.model || g.gpuConfig?.gpuModel || `GPU ${i+1}`}</strong></Typography>
                          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>GPU: {g.gpuConfig?.gpuModel}</Typography>
                          <div className="panel-meta">
                            <div className="kv">VRAM: {g.gpuConfig?.requiredVram}</div>
                            <div className="kv">${g.gpuConfig?.pricePerHour}/hr</div>
                            <div className="kv">tokens: {g.totalToken}</div>
                          </div>
                        </Grid>
                        <Grid item xs={4} className="right" sx={{ textAlign: 'right' }}>
                          <Button className="btn-ghost" size="small" variant={selectedGpu === g ? 'contained' : 'outlined'} onClick={() => setSelectedGpu(g)} sx={{ mr: 1, mb: 1 }}>
                            {selectedGpu === g ? 'Selected' : 'Select'}
                          </Button>
                          <Button className="btn-ghost" size="small" onClick={() => {
                            try {
                              const parsed = JSON.parse(customDeployBody || '{}');
                              parsed.gpuConfig = g.gpuConfig;
                              parsed.dockerImage = parsed.dockerImage || customDockerImage;
                              parsed.model = parsed.model || customModel || g.gpuConfig?.model || parsed.model;
                              setCustomDeployBody(JSON.stringify(parsed, null, 2));
                              setSelectedGpu(g);
                            } catch (err) {
                              setError('Invalid custom deploy JSON; fix it before injecting.');
                            }
                          }}>Inject</Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}

                  <Box sx={{ mt: 3 }} className="panel-actions-section">
                    <Button className="btn-primary" variant="contained" onClick={callCustomDeployWithSelected} disabled={!selectedGpu} sx={{ mr: 2 }}>
                      Send Selected to /custom-deploy
                    </Button>
                    <Button className="btn-ghost" variant="outlined" onClick={() => {
                      if (!selectedGpu) return setError('Select a GPU first');
                      try {
                        const parsed = JSON.parse(customDeployBody || '{}');
                        parsed.gpuConfig = selectedGpu.gpuConfig;
                        parsed.dockerImage = parsed.dockerImage || customDockerImage;
                        setCustomDeployBody(JSON.stringify(parsed, null, 2));
                        setMessage && setMessage({ type: 'success', text: 'Injected selected GPU into payload' });
                      } catch (err) {
                        setError('Invalid custom deploy JSON; fix it before injecting.');
                      }
                    }}>Inject into JSON</Button>
                  </Box>
                </Box>
              ) : (
                <pre>{JSON.stringify(gpusResp, null, 2)}</pre>
              )}
            </div>
          </Paper>
        </Grid>

        {/* Custom Deploy Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel custom-deploy-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Custom Deployment</Typography>
            <div className="panel-content">
              <TextField label="Model Name" fullWidth value={customModel} onChange={(e) => setCustomModel(e.target.value)} />
              <TextField label="Docker Image" fullWidth value={customDockerImage} onChange={(e) => setCustomDockerImage(e.target.value)} />
              <TextField label="Environment Variables (KEY=VALUE per line)" fullWidth multiline minRows={3} value={customEnvText} onChange={(e) => setCustomEnvText(e.target.value)} />
              
              <Button variant="outlined" onClick={() => {
                try {
                  const parsed = JSON.parse(customDeployBody || '{}');
                  parsed.dockerImage = customDockerImage || parsed.dockerImage;
                  if (customModel) parsed.model = customModel;
                  const env = {};
                  customEnvText.split('\n').forEach((line) => {
                    const t = line.trim(); if (!t) return;
                    const idx = t.indexOf('='); if (idx === -1) return;
                    const k = t.slice(0, idx).trim(); const v = t.slice(idx+1).trim(); if (k) env[k] = v;
                  });
                  if (!parsed.gpuConfig) parsed.gpuConfig = {};
                  if (Object.keys(env).length > 0) parsed.gpuConfig.env = env;
                  setCustomDeployBody(JSON.stringify(parsed, null, 2));
                } catch (err) {
                  setError('Invalid JSON body; fix manually before injecting.');
                }
              }}>Build Payload</Button>

              <TextField label="JSON Body" fullWidth multiline minRows={6} value={customDeployBody} onChange={(e) => setCustomDeployBody(e.target.value)} />
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }} className="panel-actions-section">
                <TextField label="Duration (hours)" type="number" value={customDuration} onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)} sx={{ width: 180 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input id="autoextend-checkbox" type="checkbox" checked={customAutoExtend} onChange={(e) => setCustomAutoExtend(e.target.checked)} />
                  <label htmlFor="autoextend-checkbox">Auto-Extend</label>
                </Box>
              </Box>

              <Button className="btn-primary" variant="contained" onClick={callCustomDeploy}>Call /custom-deploy</Button>
              
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(customDeployResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Close Panel */}
        <Grid item xs={12} md={4}>
          <Paper className="panel close-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Close Deployment</Typography>
            <div className="panel-content">
              <TextField label="Job ID" fullWidth value={closeJobId} onChange={(e) => setCloseJobId(e.target.value)} />
              <Button className="btn-primary" variant="contained" onClick={callClose}>Call /close</Button>
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(closeResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Deployment Panel */}
        <Grid item xs={12} md={4}>
          <Paper className="panel deployment-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Get Deployment</Typography>
            <div className="panel-content">
              <TextField label="Deployment ID" fullWidth value={deploymentId} onChange={(e) => setDeploymentId(e.target.value)} />
              <Button className="btn-primary" variant="contained" onClick={callGetDeployment}>Get Deployment</Button>
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(deploymentResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Network Status Panel */}
        <Grid item xs={12} md={4}>
          <Paper className="panel network-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Network Status</Typography>
            <div className="panel-content">
              <Button className="btn-primary" variant="contained" onClick={callNetworkStatus}>Refresh</Button>
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(networkResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Logs Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel logs-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Get Logs</Typography>
            <div className="panel-content">
              <TextField label="IPFS Hash" fullWidth value={logsIpfs} onChange={(e) => setLogsIpfs(e.target.value)} />
              <Button className="btn-primary" variant="contained" onClick={callGetLogs}>Get Logs</Button>
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(logsResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Health Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel health-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Health Check</Typography>
            <div className="panel-content">
              <Button className="btn-primary" variant="contained" onClick={callHealth}>Check Health</Button>
              <Box>
                <Typography variant="subtitle2">Response</Typography>
                <pre>{JSON.stringify(healthResp, null, 2)}</pre>
              </Box>
            </div>
          </Paper>
        </Grid>

        {/* Deployments Panel */}
        <Grid item xs={12} md={6}>
          <Paper className="panel deployments-panel" sx={{ p: 2 }}>
            <Typography variant="h6">Deployments Management</Typography>
            <div className="panel-content">
              <Box sx={{ display: 'flex', gap: 2 }} className="panel-actions-section">
                <Button className="btn-primary" onClick={callDeploymentsUser}>Fetch My Deployments</Button>
                <Button className="btn-ghost" onClick={callDeploymentsAll}>Fetch All</Button>
                <Button className="btn-ghost" onClick={callDeploymentsAllNosana}>Fetch All (Nosana)</Button>
                <Button className="btn-ghost" onClick={callDeploymentsStatusSummary}>Status Summary</Button>
              </Box>
              
              <pre>{JSON.stringify(deploymentsUser || deploymentsAll || deploymentsNosana || deploymentsSummary, null, 2)}</pre>
              
              {(deploymentsUser && deploymentsUser.deployments && deploymentsUser.deployments.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  {deploymentsUser.deployments.map((d) => (
                    <Paper key={d.deploymentId || d._id} sx={{ p: 2, mb: 2 }} className="gpu-card">
                      <Typography variant="h6"><strong>{d.deploymentId || d._id}</strong> — {d.model}</Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                        Status: {d.status} | AutoExtend: {d.autoExtend ? 'yes' : 'no'}
                      </Typography>
                      <Box>
                        <Button className="btn-primary" size="small" onClick={async () => { await enableAutoExtend(d.deploymentId || d._id); }}>
                          Enable Auto-Extend
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}