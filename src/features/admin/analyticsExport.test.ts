import { describe, expect, it } from 'vitest';
import { buildAnalyticsExport } from '@/features/admin/analyticsExport';

const series = {
  monthlyRevenue: [
    { label: 'Apr', value: 3045 },
    { label: 'May', value: 0 },
    { label: 'Jun', value: 4725 },
    { label: 'Jul', value: 0 },
    { label: 'Aug', value: 5670 },
    { label: 'Sep', value: 9093 },
  ],
  statusSegments: [
    { label: 'Pending', value: 2, color: '#ed6c02' },
    { label: 'Processing', value: 1, color: '#0288d1' },
    { label: 'Shipped', value: 1, color: '#7c4dff' },
    { label: 'Delivered', value: 2, color: '#2e7d32' },
    { label: 'Cancelled', value: 0, color: '#9e9e9e' },
  ],
  orderCount: 6,
};

describe('buildAnalyticsExport', () => {
  it('produces a CSV with both series and totals', () => {
    const { csv, filename } = buildAnalyticsExport(series);

    expect(filename).toMatch(/^classic-watch-pro-sales-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv).toContain('Classic Watch Pro — Sales analytics');
    expect(csv).toContain('Revenue by month');
    expect(csv).toContain('Month,Revenue');
    expect(csv).toContain('Apr,3045');
    expect(csv).toContain('Total,22533'); // 3045 + 4725 + 5670 + 9093
    expect(csv).toContain('Orders by status');
    expect(csv).toContain('Status,Orders,Share');
    expect(csv).toContain('Delivered,2,33.3%');
    expect(csv).toContain('Cancelled,0,0.0%');
  });

  it('builds print HTML with formatted currency in the revenue table', () => {
    const { printHtml } = buildAnalyticsExport(series);

    expect(printHtml).toContain('<h1>Classic Watch Pro — Sales analytics</h1>');
    expect(printHtml).toContain('Last 6 months · 6 orders included');
    expect(printHtml).toContain('<h2>Revenue by month</h2>');
    expect(printHtml).toContain('$3,045.00');
    expect(printHtml).toContain('<h2>Orders by status</h2>');
    expect(printHtml).toContain('<td>Delivered</td>');
  });

  it('handles an empty store (no orders yet)', () => {
    const empty = buildAnalyticsExport({
      monthlyRevenue: [
        { label: 'Apr', value: 0 },
        { label: 'May', value: 0 },
      ],
      statusSegments: [
        { label: 'Pending', value: 0, color: '#ed6c02' },
        { label: 'Delivered', value: 0, color: '#2e7d32' },
      ],
      orderCount: 0,
    });

    expect(empty.csv).toContain('Orders included,0');
    expect(empty.csv).toContain('Total,0');
    expect(empty.printHtml).toContain('0 orders included');
  });
});
