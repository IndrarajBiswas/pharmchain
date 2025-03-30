// src/pages/ViewFiles.tsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, Link as MuiLink, TextField, Button } from '@mui/material';

interface Batch {
  batchId: string;
  cid: string;
}

const ViewFiles: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('uploadedBatches');
    const storedBatches = stored ? JSON.parse(stored) : [];
    console.log("Retrieved from localStorage:", storedBatches);
    setBatches(storedBatches);
    setFilteredBatches(storedBatches);
  }, []);

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredBatches(batches);
      return;
    }
    const filtered = batches.filter(
      (batch) =>
        batch.cid.toLowerCase().includes(query) ||
        batch.batchId.toLowerCase().includes(query)
    );
    setFilteredBatches(filtered);
  };

  const getIpfsUrl = (cid: string) => {
    const gateway = process.env.REACT_APP_GATEWAY_URL;
    const url = gateway ? `https://${gateway}/ipfs/${cid}` : '';
    console.log(`Generated IPFS URL for CID ${cid}:`, url);
    return url;
  };

  return (
    <Container>
      <Box my={5}>
        <Typography variant="h4" gutterBottom>
          View Uploaded Files
        </Typography>
        <Box mb={2}>
          <TextField
            label="Search by CID or Batch ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={handleSearch} sx={{ mt: 1 }}>
            Search
          </Button>
        </Box>
        {filteredBatches.length === 0 ? (
          <Typography variant="body1">No batches found.</Typography>
        ) : (
          <List>
            {filteredBatches.map((batch, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`Batch ID: ${batch.batchId}`}
                  secondary={
                    <MuiLink href={getIpfsUrl(batch.cid)} target="_blank" rel="noopener noreferrer">
                      View File (CID: {batch.cid})
                    </MuiLink>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default ViewFiles;
