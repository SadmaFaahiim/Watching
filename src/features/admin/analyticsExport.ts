import { buildPrintHtml, toCsv, type CsvCell } from '@/utils/export';
import { formatCurrency } from '@/utils/helpers';

export interface AnalyticsSeries {
  monthlyRevenue: { label: string; value: number }[];
  statusSegments: { label: string; value: number; color: string }[];
  orderCount: number;
}

export interface AnalyticsExportReport {
  csv: string;
  filename: string;
  printHtml: string;
}

export const buildAnalyticsExport = (series: AnalyticsSeries): AnalyticsExportReport => {
  const { monthlyRevenue, statusSegments, orderCount } = series;
  const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.value, 0);
  const totalOrders = statusSegments.reduce((sum, segment) => sum + segment.value, 0);
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10);

  const revenueRows: CsvCell[][] = [
    ['Month', 'Revenue'],
    ...monthlyRevenue.map((month) => [month.label, month.value]),
    ['Total', totalRevenue],
  ];
  const statusRows: CsvCell[][] = [
    ['Status', 'Orders', 'Share'],
    ...statusSegments.map((segment) => [
      segment.label,
      segment.value,
      totalOrders > 0 ? `${((segment.value / totalOrders) * 100).toFixed(1)}%` : '0.0%',
    ]),
    ['Total', totalOrders, '100.0%'],
  ];

  const csv = toCsv([
    ['Classic Watch Pro — Sales analytics'],
    [`Generated`, date.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })],
    ['Orders included', String(orderCount)],
    [],
    ['Revenue by month'],
    ...revenueRows,
    [],
    ['Orders by status'],
    ...statusRows,
  ]);

  const printHtml = buildPrintHtml({
    title: 'Sales analytics',
    subtitle: `Last 6 months · ${orderCount} order${orderCount === 1 ? '' : 's'} included`,
    generatedAt: date,
    sections: [
      {
        heading: 'Revenue by month',
        caption: `Total ${formatCurrency(totalRevenue)}`,
        rows: revenueRows.map((row, index) =>
          row.map((cell, cellIndex) =>
            index > 0 && cellIndex > 0 && typeof cell === 'number' ? formatCurrency(cell) : cell
          )
        ),
      },
      {
        heading: 'Orders by status',
        caption: `${totalOrders} order${totalOrders === 1 ? '' : 's'}`,
        rows: statusRows.map((row, index) =>
          row.map((cell, cellIndex) =>
            index > 0 && cellIndex === 1 && typeof cell === 'number' ? String(cell) : cell
          )
        ),
      },
    ],
  });

  return { csv, filename: `classic-watch-pro-sales-${stamp}.csv`, printHtml };
};
