import { Box, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'grid' | 'list';
}

const LINE_WIDTHS = [92, 75, 88];

const SkeletonLoader = ({ count = 6, variant = 'grid' }: SkeletonLoaderProps) => {
  if (variant === 'list') {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {Array.from({ length: Math.min(count, 6) }, (_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              className="skeleton"
              sx={{ width: 88, height: 88, borderRadius: 1.5, flexShrink: 0 }}
            />
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                justifyContent: 'center',
              }}
            >
              <Box className="skeleton" sx={{ width: '45%', height: 14, borderRadius: 1 }} />
              <Box
                className="skeleton"
                sx={{
                  width: `${LINE_WIDTHS[index % LINE_WIDTHS.length]}%`,
                  height: 14,
                  borderRadius: 1,
                }}
              />
              <Box className="skeleton" sx={{ width: '25%', height: 14, borderRadius: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <Grid item key={index} xs={6} sm={4} lg={3}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box className="skeleton" sx={{ aspectRatio: '1 / 1', borderRadius: 1.5 }} />
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box className="skeleton" sx={{ width: '35%', height: 12, borderRadius: 1 }} />
              <Box className="skeleton" sx={{ width: '75%', height: 14, borderRadius: 1 }} />
              <Box className="skeleton" sx={{ width: '45%', height: 16, borderRadius: 1 }} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default SkeletonLoader;
