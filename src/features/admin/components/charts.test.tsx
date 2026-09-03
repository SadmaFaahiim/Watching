// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SimpleBarChart from '@/features/admin/components/SimpleBarChart';
import StatusDonut from '@/features/admin/components/StatusDonut';

describe('SimpleBarChart', () => {
  it('renders one bar per datum with a tooltip', () => {
    const { container } = render(
      <SimpleBarChart
        data={[
          { label: 'Jan', value: 1200 },
          { label: 'Feb', value: 3400 },
          { label: 'Mar', value: 800 },
        ]}
        formatValue={(value) => `$${value}`}
      />
    );

    expect(screen.getByRole('img', { name: 'Bar chart' })).toBeInTheDocument();
    expect(container.querySelectorAll('rect')).toHaveLength(3);
    const tooltips = Array.from(container.querySelectorAll('title')).map(
      (node) => node.textContent ?? ''
    );
    expect(tooltips.some((text) => text.includes('$3400'))).toBe(true);
  });

  it('handles an empty dataset without dividing by zero', () => {
    const { container } = render(<SimpleBarChart data={[]} />);
    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });
});

describe('StatusDonut', () => {
  it('renders the total, segments and legend labels', () => {
    const { container } = render(
      <StatusDonut
        segments={[
          { label: 'Pending', value: 2, color: '#ed6c02' },
          { label: 'Delivered', value: 4, color: '#2e7d32' },
          { label: 'Cancelled', value: 0, color: '#9e9e9e' },
        ]}
      />
    );

    // Track circle + one segment per non-zero value.
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    // Zero-valued segments are hidden from the legend.
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no orders', () => {
    render(<StatusDonut segments={[{ label: 'Pending', value: 0, color: '#ed6c02' }]} />);
    expect(screen.getByText('No orders yet.')).toBeInTheDocument();
  });
});