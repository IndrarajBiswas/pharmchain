// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Dashboard from './pages/Dashboard';
import BatchRegistry from './pages/BatchRegistry';
import ViewFiles from './pages/ViewFiles';

const App: React.FC = () => {
  return (
    <Router>
      <CssBaseline />
      <Container>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batches" element={<BatchRegistry />} />
          <Route path="/view" element={<ViewFiles />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
