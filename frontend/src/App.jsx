import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AppRoutes />
        <ToastContainer />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
