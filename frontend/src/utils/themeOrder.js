const DESKTOP_THEMES = ["fog", "blood", "eldritch"];
const MOBILE_THEMES = ["blood", "fog", "eldritch"];

export const getThemeOrder = (isMobile) =>
  isMobile ? MOBILE_THEMES : DESKTOP_THEMES;

export const getNextTheme = (theme, order = DESKTOP_THEMES) => {
  const index = order.indexOf(theme);
  return order[(index + 1 + order.length) % order.length];
};
