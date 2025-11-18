import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './AdminDashboard.css';

const API_BASE = 'http://llmapi.inferia.ai/api5000/admin';

function formatBytes(bytes) {
  if (bytes == null) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

function formatUptime(secs) {
  if (secs == null) return '-';
  const days = Math.floor(secs / 86400);
  secs %= 86400;
  const hours = Math.floor(secs / 3600);
  secs %= 3600;
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Helper function to format token balances
function formatTokenBalance(balance) {
  if (balance == null || balance === '-') return '-';
  return parseFloat(balance).toLocaleString(undefined);
}

// ✅ ENHANCED: Calculate remaining time for job
function calculateRemainingTime(timeStart, timeout) {
  if (!timeStart || !timeout) return null;
  
  const endTime = timeStart + timeout;
  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = endTime - currentTime;
  
  if (remaining <= 0) return { expired: true, text: 'Expired' };
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return { expired: false, text: parts.join(' ') };
}

// ✅ ENHANCED: Format duration from seconds
function formatDuration(seconds) {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : '< 1m';
}

// ✅ ENHANCED: Get server status based on availability only
function getServerStatus(server) {
  if (!server) return 'offline';
  
  const availability = server.performance?.availability || 0;
  
  if (availability >= 100) {
    return server.concurrent >= server.maxConcurrent ? 'busy' : 'healthy';
  } else if (availability > 0) {
    return 'degraded';
  }
  
  return 'offline';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedServers, setExpandedServers] = useState({});

  // ✅ useCallback to prevent re-renders
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [statsRes, healthRes, balancesRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/health`),
        fetch("https://llmapi.inferia.ai/api4000/balances")
      ]);

      if (!statsRes.ok || !healthRes.ok || !balancesRes.ok) {
        throw new Error(`Fetch failed (${statsRes.status}/${healthRes.status}/${balancesRes.status})`);
      }

      const [statsJson, healthJson, balancesJson] = await Promise.all([
        statsRes.json(),
        healthRes.json(),
        balancesRes.json()
      ]);

      setStats(statsJson);
      setHealth(healthJson);
      setBalances(balancesJson);
    } catch (err) {
      console.error('[AdminDashboard Error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ✅ ENHANCED: Extract all servers (globalServer + servers object)
  const servers = useMemo(() => {
    if (!stats?.loadBalancer) return [];
    
    const allServers = [];
    
    // Add globalServer if it exists
    if (stats.loadBalancer.globalServer) {
      allServers.push(['globalServer', stats.loadBalancer.globalServer]);
    }
    
    // Add all servers from servers object
    if (stats.loadBalancer.servers) {
      const serverEntries = Object.entries(stats.loadBalancer.servers);
      allServers.push(...serverEntries);
    }
    
    return allServers;
  }, [stats]);

  // ✅ ENHANCED: Toggle server expansion
  const toggleServerExpansion = (serverId) => {
    setExpandedServers(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }));
  };

  // ✅ ENHANCED: Render job details with complete information
  const renderJobDetails = (jobDetails) => {
    if (!jobDetails) return null;

    const remainingTime = calculateRemainingTime(jobDetails.timeStart, jobDetails.timeout);
    const totalDuration = formatDuration(jobDetails.timeout);

    return (
      <div className="job-details-expanded">
        <h4>📋 Complete Job Details</h4>
        
        <div className="job-sections">
          {/* Basic Job Info */}
          <div className="job-section">
            <h5>📊 Job Information</h5>
            <div className="job-grid">
              <div><strong>State:</strong> <span className={`job-state state-${jobDetails.state}`}>{jobDetails.state || 'Unknown'}</span></div>
              <div><strong>Type:</strong> {jobDetails.type || 'Unknown'}</div>
              <div><strong>Price:</strong> {jobDetails.price || 0} NOS</div>
              <div><strong>USD/Hour:</strong> ${jobDetails.usdRewardPerHour?.toFixed(6) || '0.000000'}</div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="job-section">
            <h5>⏰ Timing Information</h5>
            <div className="job-grid">
              <div><strong>Started:</strong> {jobDetails.timeStart ? new Date(jobDetails.timeStart * 1000).toLocaleString() : '-'}</div>
              <div><strong>Listed At:</strong> {jobDetails.listedAt ? new Date(jobDetails.listedAt * 1000).toLocaleString() : '-'}</div>
              <div><strong>Total Duration:</strong> {totalDuration}</div>
              <div><strong>Time Remaining:</strong> 
                <span className={remainingTime?.expired ? 'time-expired' : 'time-remaining'}>
                  {remainingTime ? remainingTime.text : '-'}
                </span>
              </div>
              <div><strong>Time End:</strong> {jobDetails.timeEnd ? new Date(jobDetails.timeEnd * 1000).toLocaleString() : 'Not ended'}</div>
              <div><strong>Benchmark Processed:</strong> {jobDetails.benchmarkProcessedAt ? new Date(jobDetails.benchmarkProcessedAt * 1000).toLocaleString() : 'Not processed'}</div>
            </div>
          </div>

          {/* Container Details */}
          {jobDetails.jobDefinition?.ops?.[0]?.args && (
            <div className="job-section">
              <h5>🐳 Container Configuration</h5>
              <div className="job-grid">
                <div><strong>Image:</strong> <code>{jobDetails.jobDefinition.ops[0].args.image}</code></div>
                <div><strong>GPU:</strong> {jobDetails.jobDefinition.ops[0].args.gpu ? '✅ Yes' : '❌ No'}</div>
                <div><strong>Ports:</strong> {jobDetails.jobDefinition.ops[0].args.expose?.length > 0 
                  ? jobDetails.jobDefinition.ops[0].args.expose.map(e => e.port).join(', ')
                  : 'None'
                }</div>
              </div>
            </div>
          )}

          {/* System Requirements */}
          {jobDetails.jobDefinition?.meta?.system_requirements && (
            <div className="job-section">
              <h5>⚙️ System Requirements</h5>
              <div className="job-grid">
                <div><strong>CUDA Version:</strong> {jobDetails.jobDefinition.meta.system_requirements.required_cuda?.join(', ') || 'Not specified'}</div>
                <div><strong>Trigger:</strong> {jobDetails.jobDefinition.meta.trigger || 'Unknown'}</div>
              </div>
            </div>
          )}

          {/* IDs and Addresses */}
          <div className="job-section">
            <h5>🔗 Identifiers</h5>
            <div className="id-grid">
              <div title={jobDetails.ipfsJob}>
                <strong>IPFS Job:</strong> 
                <code>{jobDetails.ipfsJob || 'Not available'}</code>
              </div>
              <div title={jobDetails.market}>
                <strong>Market:</strong> 
                <code>{jobDetails.market ? `${jobDetails.market}` : 'Not available'}</code>
              </div>
              <div title={jobDetails.node}>
                <strong>Node:</strong> 
                <code>{jobDetails.node ? `${jobDetails.node}` : 'Not available'}</code>
              </div>
              <div title={jobDetails.payer}>
                <strong>Payer:</strong> 
                <code>{jobDetails.payer ? `${jobDetails.payer}` : 'Not available'}</code>
              </div>
              <div title={jobDetails.project}>
                <strong>Project:</strong> 
                <code>{jobDetails.project ? `${jobDetails.project}` : 'Not available'}</code>
              </div>
            </div>
          </div>

          {/* Job Definition Details */}
          <div className="job-section">
            <h5>📄 Job Definition</h5>
            <div className="job-grid">
              <div><strong>Type:</strong> {jobDetails.jobDefinition?.type || 'Unknown'}</div>
              <div><strong>Version:</strong> {jobDetails.jobDefinition?.version || 'Unknown'}</div>
              <div><strong>Operation ID:</strong> {jobDetails.jobDefinition?.ops?.[0]?.id || 'Unknown'}</div>
              <div><strong>Operation Type:</strong> {jobDetails.jobDefinition?.ops?.[0]?.type || 'Unknown'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Render server card with availability-based status
  const renderServerCard = ([id, server]) => {
    if (!server) return null;

    const isExpanded = expandedServers[id];
    const status = getServerStatus(server);
    const availability = server.performance?.availability || 0;

    return (
      <div key={id} className={`server-card ${status} ${isExpanded ? 'expanded' : ''}`}>
        <div className="server-header" onClick={() => toggleServerExpansion(id)}>
          <div className="server-info">
            <div className={`status-dot ${status}`} />
            <div className="server-id">{id}</div>
            <span className={`status-badge ${status}`}>
              {
              status === 'healthy' ? '✅ Healthy' : 
               status === 'busy' ? '🟡 Busy' : 
               status === 'degraded' ? '🟠 Degraded' : '🔴 Offline'}
            </span>
          </div>
          <div className="server-metrics">
            <span className="concurrent">{server.concurrent || 0}/{server.maxConcurrent || 0}</span>
            <span className="availability">{availability.toFixed(1)}%</span>
            <span className="expand-icon">{isExpanded ? '▼' : '►'}</span>
          </div>
        </div>
        
        <div className="server-body">
          <div className="server-basic-info">
            <div><strong>Model:</strong> {Array.isArray(server.model) ? server.model.join(', ') : server.model || 'Unknown'}</div>
            <div><strong>Region:</strong> {server.region || 'Unknown'}</div>
            <div><strong>Capabilities:</strong> {server.capabilities?.join(', ') || 'None'}</div>
            {/* ✅ ENHANCED: Display URL */}
            {server.url && (
              <div className="server-url">
                <strong>URL:</strong> 
                <a href={server.url} target="_blank" rel="noopener noreferrer" title={server.url}>
                  {server.url.length > 50 ? `${server.url.slice(0, 47)}...` : server.url}
                </a>
              </div>
            )}
          </div>
          
          <div className="server-performance">
            <div><strong>Avg Response:</strong> {server.performance?.avgResponseTime ? `${Math.round(server.performance.avgResponseTime)}ms` : '-'}</div>
            <div><strong>P95 Response:</strong> {server.performance?.p95ResponseTime ? `${server.performance.p95ResponseTime}ms` : '-'}</div>
            <div><strong>Throughput:</strong> {server.performance?.throughput ? `${server.performance.throughput.toFixed(1)}/s` : '-'}</div>
            <div><strong>Error Rate:</strong> {server.performance?.errorRate ? `${(server.performance.errorRate * 100).toFixed(1)}%` : '-'}</div>
          </div>

          {/* ✅ ENHANCED: Complete job details */}
          {isExpanded && renderJobDetails(server.jobDetails)}

          {/* Circuit Breaker Info */}
          {isExpanded && server.circuitBreaker && (
            <div className="circuit-breaker-info">
              <h5>🔌 Circuit Breaker</h5>
              <div className="cb-grid">
                <div><strong>State:</strong> {server.circuitBreaker.state}</div>
                <div><strong>Failures:</strong> {server.circuitBreaker.failureCount}</div>
                <div><strong>Next Attempt:</strong> {server.circuitBreaker.nextAttempt ? new Date(server.circuitBreaker.nextAttempt).toLocaleString() : 'Immediate'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="header">
        <h2>Admin Dashboard</h2>
        <div className="header-actions">
          <button className="refresh" onClick={fetchStats} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div className="error">⚠️ {error}</div>}

      <div className="overview">
        <div className={`status-pill ${health?.status === 'healthy' ? 'ok' : 'bad'}`}>
          {health?.status || 'unknown'}
        </div>
        <div className="timestamp">
          {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '-'}
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Load Balancer</h3>
          <div className="row"><strong>Total Servers:</strong> {stats?.loadBalancer?.totalServers ?? '-'}</div>
          <div className="row"><strong>Healthy Servers:</strong> {stats?.loadBalancer?.healthyServers ?? '-'}</div>
          <div className="row"><strong>Total Concurrent:</strong> {stats?.loadBalancer?.totalConcurrent ?? '-'}</div>
        </div>

        <div className="card">
          <h3>System</h3>
          <div className="row"><strong>Uptime:</strong> {formatUptime(stats?.system?.uptime)}</div>
          <div className="row"><strong>Memory (RSS):</strong> {formatBytes(stats?.system?.memory?.rss)}</div>
          <div className="row"><strong>Timestamp:</strong> {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : '-'}</div>
        </div>

        <div className="card">
          <h3>Redis</h3>
          <div className="row">{stats?.redis ?? '-'}</div>
        </div>

        {/* New Token Balances Card */}
        <div className="card">
          <h3>Wallet Balances</h3>
          <div className="row">
            <strong>Public Key:</strong> 
            <span className="public-key" title={balances?.publicKey}>
              {balances?.publicKey ? `${balances.publicKey.slice(0, 8)}...${balances.publicKey.slice(-8)}` : '-'}
            </span>
          </div>
          <div className="row"><strong>SOL:</strong> {formatTokenBalance(balances?.sol)}</div>
          <div className="row"><strong>USDC:</strong> {formatTokenBalance(balances?.usdc)}</div>
          <div className="row"><strong>NOS:</strong> {formatTokenBalance(balances?.nos)}</div>
        </div>
      </div>

      <section>
        <h3>Servers ({servers.length})</h3>
        <div className="server-grid">
          {servers.length === 0 && <div className="empty">No server data available</div>}
          {servers.map(renderServerCard)}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Raw JSON (for debugging)</h3>
        <pre className="raw">
          {JSON.stringify({ health, stats, balances }, null, 2)}
        </pre>
      </section>
    </div>
  );
}