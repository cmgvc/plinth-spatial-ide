import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store } from './stores'; 
import { ReactFlowProvider } from 'reactflow';
import App from './App';
import '../index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter> 
        <ReactFlowProvider>
          <App />
        </ReactFlowProvider>
      </HashRouter>
    </Provider>
  </React.StrictMode>
);