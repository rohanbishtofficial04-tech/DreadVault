import { getNextTheme, getThemeOrder } from "./themeOrder";

describe("theme cycling order", () => {
  it("cycles mobile themes from Blood to Fog to Eldritch", () => {
    const themes = getThemeOrder(true);

    expect(themes).toEqual(["blood", "fog", "eldritch"]);
    expect(getNextTheme("blood", themes)).toBe("fog");
    expect(getNextTheme("fog", themes)).toBe("eldritch");
    expect(getNextTheme("eldritch", themes)).toBe("blood");
  });

  it("preserves the desktop theme order", () => {
    const themes = getThemeOrder(false);

    expect(themes).toEqual(["fog", "blood", "eldritch"]);
    expect(getNextTheme("fog", themes)).toBe("blood");
    expect(getNextTheme("blood", themes)).toBe("eldritch");
    expect(getNextTheme("eldritch", themes)).toBe("fog");
  });
});
