import React, { useState, useEffect } from 'react';
import '../styles/DebugPage.css';

const DebugPage = ({ userId }) => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [showRawResponse, setShowRawResponse] = useState(false);

  // Add a message to the log
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-50)); // Keep last 50 logs
  };

  // Check backend status
  const checkBackend = async () => {
    setBackendStatus('checking');
    addLog('Checking backend status...', 'info');
    
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setBackendStatus('online');
        addLog('Backend is online', 'success');
      } else {
        setBackendStatus('offline');
        addLog(`Backend returned status: ${response.status}`, 'error');
      }
    } catch (error) {
      setBackendStatus('offline');
      addLog(`Error connecting to backend: ${error.message}`, 'error');
    }
  };

  // Test API endpoint
  const testApiEndpoint = async () => {
    if (!userId) {
      addLog('No user ID provided', 'error');
      return;
    }

    setLoading(true);
    setApiResponse(null);
    setApiError(null);
    addLog(`Testing API endpoint for user ${userId}...`, 'info');

    try {
      const response = await fetch(`http://localhost:5000/api/list/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      setApiResponse(data);
      setLocalItems(Array.isArray(data) ? data : []);
      addLog(`API request successful. Received ${Array.isArray(data) ? data.length : 0} items`, 'success');
    } catch (error) {
      setApiError(error.message);
      addLog(`API error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check backend status on component mount
  useEffect(() => {
    checkBackend();
    addLog('Debug page initialized', 'info');
    addLog(`User ID: ${userId || 'Not provided'}`, userId ? 'success' : 'warning');
  }, [userId]);

  return (
    <div className="debug-container">
      <h1>Debug Dashboard</h1>
      
      <div className="debug-section">
        <h2 className="debug-title">Connection Status</h2>
        <div>
          <span className={`status-indicator status-${backendStatus}`}></span>
          Backend: {backendStatus.toUpperCase()}
          <button className="debug-button" onClick={checkBackend}>
            Re-check
          </button>
        </div>
      </div>

      <div className="debug-section">
        <h2 className="debug-title">API Test</h2>
        <div>
          <button 
            className="debug-button" 
            onClick={testApiEndpoint}
            disabled={!userId || loading}
          >
            {loading ? 'Testing...' : 'Test API Endpoint'}
          </button>
          
          {apiError && (
            <div className="debug-output error">
              Error: {apiError}
            </div>
          )}

          {apiResponse && (
            <div>
              <button 
                className="debug-button" 
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                {showRawResponse ? 'Hide Raw Response' : 'Show Raw Response'}
              </button>
              
              {showRawResponse ? (
                <div className="json-viewer">
                  {JSON.stringify(apiResponse, null, 2)}
                </div>
              ) : (
                <div className="debug-output">
                  <p>Received {Array.isArray(apiResponse) ? apiResponse.length : '?'} items</p>
                  {Array.isArray(apiResponse) && apiResponse.length > 0 && (
                    <div>
                      <p>First item:</p>
                      <pre>{JSON.stringify(apiResponse[0], null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="debug-section">
        <h2 className="debug-title">Local State</h2>
        <div className="debug-output">
          <p>User ID: <strong>{userId || 'Not provided'}</strong></p>
          <p>Items in local state: <strong>{localItems.length}</strong></p>
          <p>Loading: <strong>{loading ? 'Yes' : 'No'}</strong></p>
        </div>
      </div>

      <div className="debug-section">
        <h2 className="debug-title">Logs</h2>
        <button 
          className="debug-button" 
          onClick={() => setLogs([])}
        >
          Clear Logs
        </button>
        <div className="debug-output" style={{ maxHeight: '300px' }}>
          {logs.length === 0 ? (
            <p>No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={log.type}>
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
