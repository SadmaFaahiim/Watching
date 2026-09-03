import { Box } from '@mui/material';

export interface ChartDatum {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: ChartDatum[];
  formatValue?: (value: number) => string;
  height?: number;
  color?: string;
  ariaLabel?: string;
}

/**
 * Dependency-free bar chart rendered as pure SVG. Intentionally minimal: grid
 * lines, proportional bars, hover tooltips and x-axis labels — no chart
 * library, no network requests, no accessibility baggage.
 */
const SimpleBarChart = ({
  data,
  formatValue = (value) => String(value),
  height = 180,
  color = '#3867D6',
  ariaLabel = 'Bar chart',
}: SimpleBarChartProps) => {
  const SLOT = 20; // horizontal units per bar slot
  const PAD_BOTTOM = 22; // vertical units reserved for labels
  const BAR_WIDTH = 12;

  const width = Math.max(1, data.length) * SLOT;
  const plotHeight = height - PAD_BOTTOM;
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <Box sx={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height, display: 'block' }}
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={width}
            y1={plotHeight - tick * plotHeight}
            y2={plotHeight - tick * plotHeight}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={0.6}
          />
        ))}

        {data.map((datum, index) => {
          const barHeight = Math.max((datum.value / max) * plotHeight, datum.value > 0 ? 1.2 : 0);
          const x = index * SLOT + (SLOT - BAR_WIDTH) / 2;
          const y = plotHeight - barHeight;
          return (
            <g key={datum.label}>
              <rect x={x} y={y} width={BAR_WIDTH} height={barHeight} rx={1.5} fill={color}>
                <title>{`${datum.label}: ${formatValue(datum.value)}`}</title>
              </rect>
              <text
                x={x + BAR_WIDTH / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={7.5}
                fill="currentColor"
                opacity={0.62}
              >
                {datum.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default SimpleBarChart;