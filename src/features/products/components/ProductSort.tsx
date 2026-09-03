import { MenuItem, Select, Typography, Stack } from '@mui/material';
import type { SortOption } from '@/types';
import { SORT_OPTIONS } from '@/features/products/constants';

interface ProductSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const ProductSort = ({ value, onChange }: ProductSortProps) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: { xs: 'none', sm: 'block' } }}
      >
        Sort by
      </Typography>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        size="small"
        aria-label="Sort products"
        sx={{ minWidth: 190 }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
};

export default ProductSort;
