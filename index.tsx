
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  window.pushLog?.('Error: Root Element Not Found!');
  throw new Error("Could not find root element to mount to");
}

window.pushLog?.('Creating React Root...');
const root = ReactDOM.createRoot(rootElement);
window.pushLog?.('Rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
