import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const apiBaseUrl = '/api';
  const [endpoint, setEndpoint] = useState('https://lorem-api.com/api/lorem');
  const [frequency, setFrequency] = useState('5');
  const [duration, setDuration] = useState('3');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState({
    isActive: false,
    frequency: 0,
    remainingTime: 0,
    totalLoops: 0
  });
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch initial data and polling status
  useEffect(() => {
    fetchData();
    checkPollingStatus();
    const interval = setInterval(checkPollingStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkPollingStatus = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/status`);
      if (!res.ok) throw new Error('Failed to check polling status');
      
      const status = await res.json();
      setPollingStatus(prev => ({
        ...prev,
        ...status
      }));
    } catch (err) {
      console.error('Error checking polling status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(`${apiBaseUrl}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpoint,
          frequency: Math.max(1, parseInt(frequency)),
          duration: Math.max(1, parseInt(duration))
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to start polling');
      
      setMessage({ 
        text: `Started polling every ${result.frequency}s for ${result.duration}s`, 
        type: 'success' 
      });
      fetchData();
    } catch (err) {
      setMessage({ 
        text: err.message || 'Failed to start polling', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(`${apiBaseUrl}/data`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const data = await res.json();
      setApiData(data);
      setLastFetchTime(new Date());
      
      if (data.length === 0) {
        setMessage({ 
          text: 'No data available. Start polling to collect responses.', 
          type: 'info' 
        });
      }
    } catch (err) {
      setMessage({ 
        text: err.message || 'Failed to fetch data', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };



  const handleClearData = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(`${apiBaseUrl}/clear`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to clear data');
      
      setApiData([]);
      setLastFetchTime(new Date());
      setMessage({ 
        text: result.message || 'All data cleared', 
        type: 'success' 
      });
    } catch (err) {
      setMessage({ 
        text: err.message || 'Failed to clear data', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage for the polling
  const progressPercentage = pollingStatus.totalLoops > 0 
    ? ((pollingStatus.currentLoop / pollingStatus.totalLoops) * 100)
    : 0;

  return (
    <div className="app-container">
      <header>
        <h1>API Polling Dashboard</h1>
        <p className="subheader">Monitor and store API responses in real-time</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">API Endpoint URL</label>
          <input
            className="form-input"
            type="url"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Polling Frequency (seconds)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Total Duration (seconds)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={loading || pollingStatus.isActive}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Starting...
              </>
            ) : 'Start Polling'}
          </button>
          
        </div>
      </form>

      <div className="controls">
        <button 
          className="btn btn-secondary" 
          onClick={fetchData} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Refreshing...
            </>
          ) : 'Refresh Data'}
        </button>
        
        <button 
          className="btn btn-danger" 
          onClick={handleClearData} 
          disabled={loading || apiData.length === 0}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Clearing...
            </>
          ) : 'Clear All Data'}
        </button>
      </div>

      <div className="data-section">
        <h2>
          Collected Responses ({apiData.length})
          {lastFetchTime && (
            <span className="last-updated">
              Last fetched: {lastFetchTime.toLocaleTimeString()}
            </span>
          )}
        </h2>
        
        {apiData.length > 0 ? (
          <div className="card-grid">
            {apiData.map((item, index) => (
              <div className="card" key={`${item.timestamp}-${index}`}>
                <h3>{item.activity || 'No activity name'}</h3>
                <div className="card-content">
                  {/* <p><strong>Type:</strong> {item.type || 'N/A'}</p>
                  <p><strong>Participants:</strong> {item.participants ?? 'N/A'}</p> */}
                  <p><strong>ID:</strong> {index + 1}</p>
                  <p><strong>Time:</strong> {new Date(item.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No data collected yet. Start polling to gather responses.</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default App;
