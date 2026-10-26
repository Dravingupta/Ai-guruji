import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './AppRouter';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
