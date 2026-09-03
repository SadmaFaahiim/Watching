import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '@/store/theme.store';

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: 'system', isDark: false });
  });

  it('defaults to system mode', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('setMode light makes isDark false', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().isDark).toBe(false);
  });

  it('setMode dark makes isDark true', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it('toggleMode switches between light and dark', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().isDark).toBe(true);

    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().isDark).toBe(false);
  });
});
