import { useStore } from './store/useStore';
import { Box, Typography } from '@mui/material';

function App() {
  const count = useStore((s) => s.count);
  const inc = useStore((s) => s.increment);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        QuantEnergx Frontend
      </Typography>
      <Typography gutterBottom>
        Counter: {count}
      </Typography>
      <button onClick={inc}>Increment</button>
    </Box>
  );
}

export default App;
