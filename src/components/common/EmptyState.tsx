import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { SearchOff } from '@mui/icons-material';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

const EmptyState = ({
  title = 'Nothing here yet',
  message = 'We could not find what you are looking for. Try adjusting your search or filters.',
  action,
  icon,
}: EmptyStateProps) => {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {icon ?? <SearchOff sx={{ fontSize: 56, color: 'text.disabled' }} />}
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
