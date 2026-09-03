// Dependency-free export helpers: RFC-4180 CSV downloads and a print-to-PDF
// view (the browser's native "Save as PDF" dialog) for admin reports.

export type CsvCell = string | number | null | undefined;

/** RFC-4180 escaping: quote fields containing separators/quotes/newlines. */
const escapeCell = (value: CsvCell): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** HTML-escapes dynamic content so the print view can never inject markup. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const toCsv = (rows: CsvCell[][]): string =>
  rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');

/** Downloads a string as a UTF-8 text file. */
export const downloadTextFile = (filename: string, contents: string, mime = 'text/csv'): void => {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

/** Safe date stamp for filenames: 2026-09-03. */
export const dateStamp = (date = new Date()): string => date.toISOString().slice(0, 10);

const INDENT = '  ';

/**
 * Builds the standalone HTML document opened for "Print / PDF". Styled to be
 * legible in the browser's print dialog and on paper (no app chrome).
 */
export const buildPrintHtml = (options: {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  sections: { heading: string; rows: CsvCell[][]; caption?: string }[];
}): string => {
  const generated = options.generatedAt ?? new Date();
  const sectionHtml = options.sections
    .map((section) => {
      const head = section.rows[0] ?? [];
      const body = section.rows.slice(1);
      const headerRow = `<tr>${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr>`;
      const bodyRows = body
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');
      return [
        `<section>`,
        `${INDENT}<h2>${escapeHtml(section.heading)}</h2>`,
        section.caption ? `${INDENT}<p class="caption">${escapeHtml(section.caption)}</p>` : '',
        `${INDENT}<table>${headerRow}${bodyRows}</table>`,
        `</section>`,
      ].join('\n');
    })
    .join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '<title>Classic Watch Pro — ' + escapeHtml(options.title) + '</title>',
    '  <style>',
    '    * { box-sizing: border-box; }',
    '    body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 32px; }',
    '    header { margin-bottom: 28px; border-bottom: 2px solid #111; padding-bottom: 12px; }',
    '    h1 { font-size: 22px; margin: 0 0 4px; }',
    '    .subtitle { color: #555; margin: 0 0 8px; }',
    '    .generated { color: #888; font-size: 12px; }',
    '    section { margin-bottom: 28px; page-break-inside: avoid; }',
    '    h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px; }',
    '    .caption { color: #666; font-size: 12px; margin: -6px 0 10px; }',
    '    table { width: 100%; border-collapse: collapse; font-size: 13px; }',
    '    th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #ddd; }',
    '    th { background: #f4f4f4; font-weight: 600; }',
    '    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }',
    '    @media print { body { margin: 0; } a { color: inherit; text-decoration: none; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <header>',
    '    <h1>Classic Watch Pro — ' + escapeHtml(options.title) + '</h1>',
    options.subtitle ? `    <p class="subtitle">${escapeHtml(options.subtitle)}</p>` : '',
    `    <p class="generated">Generated ${generated.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</p>`,
    '  </header>',
    sectionHtml,
    '</body>',
    '</html>',
  ].join('\n');
};

/** Opens the print view in a new tab and triggers the print dialog. */
export const printHtml = (html: string): void => {
  const printWindow = window.open('', '_blank', 'noopener');
  if (!printWindow) {
    throw new Error('Pop-ups are blocked — allow pop-ups for this site to export as PDF.');
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  // Let the document paint before invoking print so styles apply.
  printWindow.addEventListener('load', () => printWindow.print(), { once: true });
};
