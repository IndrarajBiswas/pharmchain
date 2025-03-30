// src/pages/Dashboard.tsx
import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Container>
      <Box my={5} textAlign="center">
        <Typography variant="h3" gutterBottom>
          Welcome to PharmChain!
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Your trusted decentralized pharmaceutical supply chain.
        </Typography>
        <Box mt={3}>
          <Button variant="contained" color="primary" component={Link} to="/batches" sx={{ mr: 2 }}>
            Register a Batch
          </Button>
          <Button variant="outlined" color="secondary" component={Link} to="/view">
            View Uploaded Files
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
