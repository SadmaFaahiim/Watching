// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPrintHtml, dateStamp, downloadTextFile, printHtml, toCsv } from '@/utils/export';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toCsv', () => {
  it('joins rows with CRLF and quotes fields containing separators', () => {
    const csv = toCsv([
      ['Name', 'Notes'],
      ['Orion "Pro", 39mm', 'line1\nline2'],
      ['Plain', 42],
    ]);
    expect(csv).toBe('Name,Notes\r\n"Orion ""Pro"", 39mm","line1\nline2"\r\nPlain,42');
  });

  it('renders null and undefined as empty cells', () => {
    expect(toCsv([['a', null, undefined, 0]])).toBe('a,,,0');
  });
});

describe('downloadTextFile', () => {
  it('creates a blob anchor click and revokes the URL', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.fn();
    const anchor = { href: '', download: '', click, remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as HTMLElement);

    downloadTextFile('report.csv', 'a,b');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe('report.csv');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_001);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    vi.useRealTimers();
  });
});

describe('buildPrintHtml', () => {
  it('renders headings, captions and a table with escaped cells', () => {
    const html = buildPrintHtml({
      title: 'Sales analytics',
      subtitle: 'Last 6 months',
      generatedAt: new Date('2026-09-03T12:00:00Z'),
      sections: [
        {
          heading: 'Revenue by month',
          caption: 'Total $10.00',
          rows: [
            ['Month', 'Revenue'],
            ['Apr "sale"', 10],
          ],
        },
      ],
    });

    expect(html).toContain('<title>Classic Watch Pro — Sales analytics</title>');
    expect(html).toContain('<h2>Revenue by month</h2>');
    expect(html).toContain('<p class="caption">Total $10.00</p>');
    expect(html).toContain('<th>Month</th>');
    // The quote is escaped inside the HTML document.
    expect(html).toContain('Apr &quot;sale&quot;');
  });
});

describe('printHtml', () => {
  it('opens a new window, writes the document and triggers print', () => {
    const print = vi.fn();
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      addEventListener: vi.fn((_event: string, handler: () => void) => handler()),
      print,
    } as unknown as Window;
    const openSpy = vi.fn(() => fakeWindow);
    vi.stubGlobal('open', openSpy);

    printHtml('<html></html>');

    expect(openSpy).toHaveBeenCalledWith('', '_blank', 'noopener');
    expect(fakeWindow.document.write).toHaveBeenCalledWith('<html></html>');
    expect(print).toHaveBeenCalled();
  });

  it('throws a friendly error when pop-ups are blocked', () => {
    vi.stubGlobal(
      'open',
      vi.fn(() => null)
    );
    expect(() => printHtml('<html></html>')).toThrow(/Pop-ups are blocked/);
  });
});

describe('dateStamp', () => {
  it('formats ISO date prefix', () => {
    expect(dateStamp(new Date('2026-09-03T23:59:00Z'))).toBe('2026-09-03');
  });
});
