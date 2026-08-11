const RGB_PATTERN = /^rgba?\(([^)]+)\)$/;

/**
 * Re-alpha a resolved theme color so the chart's area gradient can follow its
 * line color. Theme tokens resolve to `rgba(...)` on web and may be a hex string
 * elsewhere, so both forms are handled; anything else is passed through.
 */
export function withAlpha(color: string, alpha: number): string {
  const rgbMatch = RGB_PATTERN.exec(color.trim());
  if (rgbMatch) {
    const [r, g, b] = rgbMatch[1].split(',').map((part) => part.trim());
    if (r && g && b) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  const hex = color.trim().replace('#', '');
  if (hex.length === 6 || hex.length === 8) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].every((channel) => Number.isFinite(channel))) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return color;
}
