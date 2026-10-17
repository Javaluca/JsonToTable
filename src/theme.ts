import { themeQuartz } from 'ag-grid-community'

export const FONT_TEXT =
  "'General Sans', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
export const FONT_MONO =
  "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace"

const SHARED = {
  fontFamily: FONT_TEXT,
  fontSize: 13,
  headerFontFamily: FONT_TEXT,
  headerFontSize: 12,
  headerFontWeight: 600,
  headerHeight: 30,
  rowHeight: 28,
  borderRadius: 0,
  borderWidth: 1,
  wrapperBorder: false,
  rowBorder: true,
  headerRowBorder: true,
  columnBorder: true,
  cellHorizontalPadding: 10,
  spacing: 4,
} as const

export const gridThemeLight = themeQuartz.withParams({
  ...SHARED,
  backgroundColor: '#ffffff',
  foregroundColor: '#1a1d21',
  subtleTextColor: '#8b929c',
  accentColor: '#2563eb',
  borderColor: '#e2e5e9',
  headerBackgroundColor: '#f6f7f9',
  headerTextColor: '#5c6470',
  oddRowBackgroundColor: '#ffffff',
  selectedRowBackgroundColor: 'rgba(37, 99, 235, 0.12)',
  rowHoverColor: 'rgba(15, 23, 42, 0.045)',
})

export const gridThemeDark = themeQuartz.withParams({
  ...SHARED,
  backgroundColor: '#14171c',
  foregroundColor: '#e6e9ee',
  subtleTextColor: '#6b7482',
  accentColor: '#3b82f6',
  borderColor: '#262b33',
  headerBackgroundColor: '#1a1e24',
  headerTextColor: '#9aa3af',
  oddRowBackgroundColor: '#14171c',
  selectedRowBackgroundColor: 'rgba(59, 130, 246, 0.22)',
  rowHoverColor: 'rgba(255, 255, 255, 0.05)',
})
