import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    // Deep royal blue reads as the brand accent on light surfaces, but as text
    // on the dark surfaces it fails WCAG AA (≈3.5:1). Dark mode therefore uses
    // a lighter periwinkle primary for text/links/outlines while contained
    // buttons keep the deep-blue gradient via the MuiButton override below.
    primary:
      mode === 'light'
        ? {
            main: '#3867D6',
            light: '#5F85DB',
            dark: '#2849A5',
            contrastText: '#ffffff',
          }
        : {
            main: '#8FAEFF',
            light: '#A7C0FF',
            dark: '#3867D6',
            contrastText: '#0B1220',
          },
    secondary: {
      main: mode === 'light' ? '#F39C12' : '#F5B041',
      light: '#F5B041',
      dark: mode === 'light' ? '#C87F0A' : '#F39C12',
      contrastText: mode === 'light' ? '#ffffff' : '#3B2A00',
    },
    // Semantic colors follow the same rule as primary: in dark mode the
    // "main" shade lifts so colored text/chips clear WCAG AA against navy
    // surfaces (MUI auto-selects dark contrast text on the lighter fills).
    error: {
      main: mode === 'light' ? '#EF4444' : '#F87171',
      light: mode === 'light' ? '#F87171' : '#FCA5A5',
      dark: mode === 'light' ? '#DC2626' : '#EF4444',
    },
    warning: {
      main: mode === 'light' ? '#F59E0B' : '#FBBF24',
      light: mode === 'light' ? '#FCD34D' : '#FDE68A',
      dark: mode === 'light' ? '#D97706' : '#F59E0B',
    },
    success: {
      main: mode === 'light' ? '#10B981' : '#34D399',
      light: mode === 'light' ? '#34D399' : '#6EE7B7',
      dark: mode === 'light' ? '#059669' : '#10B981',
    },
    info: {
      main: mode === 'light' ? '#3B82F6' : '#60A5FA',
      light: mode === 'light' ? '#60A5FA' : '#93C5FD',
      dark: mode === 'light' ? '#2563EB' : '#3B82F6',
    },
    ...(mode === 'light'
      ? {
          background: {
            default: '#F9FAFB',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1F2937',
            secondary: '#6B7280',
          },
        }
      : {
          background: {
            default: '#0F172A',
            paper: '#1E293B',
          },
          text: {
            primary: '#F1F5F9',
            // Slightly lighter than slate-400 so muted text clears WCAG AA
            // (4.5:1) even on hover surfaces (#303A4B) — #94A3B8 sits at 4.46:1.
            secondary: '#9DB0C4',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 16px 32px rgba(0,0,0,0.14)',
    '0px 20px 40px rgba(0,0,0,0.16)',
    '0px 24px 48px rgba(0,0,0,0.18)',
    '0px 28px 56px rgba(0,0,0,0.2)',
    '0px 32px 64px rgba(0,0,0,0.22)',
    '0px 36px 72px rgba(0,0,0,0.24)',
    '0px 40px 80px rgba(0,0,0,0.26)',
    '0px 44px 88px rgba(0,0,0,0.28)',
    '0px 48px 96px rgba(0,0,0,0.3)',
    '0px 52px 104px rgba(0,0,0,0.32)',
    '0px 56px 112px rgba(0,0,0,0.34)',
    '0px 60px 120px rgba(0,0,0,0.36)',
    '0px 64px 128px rgba(0,0,0,0.38)',
    '0px 68px 136px rgba(0,0,0,0.4)',
    '0px 72px 144px rgba(0,0,0,0.42)',
    '0px 76px 152px rgba(0,0,0,0.44)',
    '0px 80px 160px rgba(0,0,0,0.46)',
    '0px 84px 168px rgba(0,0,0,0.48)',
    '0px 88px 176px rgba(0,0,0,0.5)',
    '0px 92px 184px rgba(0,0,0,0.52)',
  ],
  components: {
    MuiTypography: {
      defaultProps: {
        // MUI maps subtitle1/subtitle2 to <h6> by default, which sprinkles
        // phantom headings through every page (product prices, filter group
        // labels…). Those are labels/values, not document headings — map them
        // to <div> so the heading outline stays truthful for screen readers
        // and axe's heading-order rule.
        variantMapping: {
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          h4: 'h4',
          h5: 'h5',
          h6: 'h6',
          subtitle1: 'div',
          subtitle2: 'div',
          body1: 'p',
          body2: 'p',
          caption: 'span',
          overline: 'span',
          button: 'span',
          inherit: 'p',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.938rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #3867D6 0%, #2849A5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2849A5 0%, #1D3682 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            mode === 'light' ? '0px 4px 12px rgba(0,0,0,0.08)' : '0px 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow:
              mode === 'light' ? '0px 8px 24px rgba(0,0,0,0.12)' : '0px 8px 24px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow:
            mode === 'light' ? '0px 2px 8px rgba(0,0,0,0.08)' : '0px 2px 8px rgba(0,0,0,0.3)',
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark'): Theme => {
  return createTheme(getDesignTokens(mode));
};
