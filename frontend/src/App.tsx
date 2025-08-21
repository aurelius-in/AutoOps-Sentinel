import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Grid, Paper, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import StatusCards from './components/StatusCards';
import Timeline from './components/Timeline';
import Forecast from './components/Forecast';
import RunbookCatalog from './components/RunbookCatalog';
import ChatAgent from './components/ChatAgent';
import SimulatePanel from './components/SimulatePanel';
import ReportButton from './components/ReportButton';
import Policies from './components/Policies';
import PlanPanel from './components/PlanPanel';
import Narrative from './components/Narrative';
import MetricsChart from './components/MetricsChart';
// import AnomalyStats from './components/AnomalyStats';
import BusinessTicker from './components/BusinessTicker';
import AnomaliesTable from './components/AnomaliesTable';
import ActionsTable from './components/ActionsTable';
import ServicesCatalog from './components/ServicesCatalog';

const API = '/api';

const App: React.FC = () => {
  const [summary, setSummary] = useState<{anomalies:number; actions:number; incidents:number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

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
    <>
      <AppBar position="static" color="primary" sx={{ backdropFilter: 'blur(8px)' }}>
        <Toolbar sx={{ minHeight: 42, px: 2 }}>
          <Typography variant="h6" sx={{ width: '2.5in', letterSpacing: 0.5, fontWeight: 800, fontSize: 22 }}>AutoOps Sentinel</Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              flexGrow: 1,
              minHeight: 42,
              '& .MuiTab-root': {
                color: '#0b1020',
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: 0.2,
                minHeight: 42,
                textTransform: 'none',
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#0b1020 !important',
                backgroundColor: 'rgba(255,255,255,0.55)',
                borderRadius: 10,
                boxShadow: 'inset 0 0 0 2px rgba(11,16,32,0.85), 0 4px 10px rgba(0,0,0,0.25)',
              },
              '& .MuiTab-root:hover': {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 8,
              },
              '& .MuiTabs-indicator': { backgroundColor: '#ffffff', height: 4, borderRadius: 2 },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Ops" />
            <Tab label="Agent" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <ReportButton />
        </div>

        {tab === 0 && (
          <>
            <StatusCards />
            <Box sx={{ my: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Paper sx={{ p: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ m: 0, color: '#cbd5e1' }}>Summary</Typography>
                      {loading ? (
                        <Typography variant="body2">Loading…</Typography>
                      ) : (
                        <>
                          <span style={{ color: '#94a3b8' }}>Anomalies: <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{summary?.anomalies ?? 0}</span></span>
                          <span style={{ color: '#94a3b8' }}>Actions: <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{summary?.actions ?? 0}</span></span>
                          <span style={{ color: '#94a3b8' }}>Incidents: <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{summary?.incidents ?? 0}</span></span>
                        </>
                      )}
                    </div>
                  </Paper>
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Forecast />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <MetricsChart />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {tab === 1 && (
          <Box sx={{ my: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, height: 200, overflow: 'auto' }}>
                  <Timeline />
                </Paper>
                <Paper sx={{ p: 2, mt: 2, height: 220, overflow: 'auto' }}>
                  <AnomaliesTable />
                </Paper>
                <Paper sx={{ p: 2, mt: 2, height: 220, overflow: 'auto' }}>
                  <ActionsTable />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: 220, overflow: 'auto' }}>
                  <RunbookCatalog />
                </Paper>
                <Paper sx={{ p: 2, mt: 2, height: 200, overflow: 'auto' }}>
                  <Policies />
                </Paper>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <SimulatePanel />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ my: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <ChatAgent />
                </Paper>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <PlanPanel />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <BusinessTicker />
                <Paper sx={{ p: 2 }}>
                  <Narrative />
                </Paper>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <ServicesCatalog />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
};

export default App;


