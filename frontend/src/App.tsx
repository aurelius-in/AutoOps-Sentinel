import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Grid, Paper, Button } from '@mui/material';
import StatusCards from './components/StatusCards';
import Timeline from './components/Timeline';
import Forecast from './components/Forecast';
import RunbookCatalog from './components/RunbookCatalog';
import ChatAgent from './components/ChatAgent';
import SimulatePanel from './components/SimulatePanel';
import ReportButton from './components/ReportButton';
import Policies from './components/Policies';
import PlanPanel from './components/PlanPanel';

const API = '/api';

const App: React.FC = () => {
  const [summary, setSummary] = useState<{anomalies:number; actions:number; incidents:number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API}/summary`);
        const data = await res.json();
        setSummary(data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
    const id = setInterval(fetchSummary, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>AutoOps Sentinel</Typography>
      <ReportButton />
      <StatusCards />
      <Box sx={{ my: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Summary</Typography>
              <Typography variant="body2">{loading ? 'Loading…' : JSON.stringify(summary)}</Typography>
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Forecast />
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Timeline />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <RunbookCatalog />
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <ChatAgent />
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <SimulatePanel />
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Policies />
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <PlanPanel />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default App;


