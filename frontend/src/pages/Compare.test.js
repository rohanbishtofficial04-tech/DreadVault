import {
  getBestFit,
  getContentAdvisories,
  getMultiplayerDetails,
  isSameGame,
} from "../utils/compare";

describe("comparison metadata", () => {
  it("identifies the same selected game by slug or fallback ID", () => {
    expect(isSameGame({ slug: "silent-hill-2", id: 1 }, { slug: "silent-hill-2", id: 2 })).toBe(true);
    expect(isSameGame({ id: 1 }, { id: 1 })).toBe(true);
    expect(isSameGame({ slug: "silent-hill-2" }, { slug: "silent-hill-3" })).toBe(false);
  });

  it("formats provider content descriptors without inventing warnings", () => {
    expect(getContentAdvisories({
      age_ratings: [{ descriptors: ["Blood", { description: "Violence" }] }],
    })).toBe("Blood, Violence");
    expect(getContentAdvisories({ age_ratings: [] })).toBe("Not listed by provider");
  });

  it("summarizes listed co-op and player limits", () => {
    expect(getMultiplayerDetails({
      multiplayer_modes: [{
        online_coop: true,
        online_coop_max: 4,
        split_screen: true,
      }],
    })).toBe("Online co-op (up to 4), Split-screen");
    expect(getMultiplayerDetails({ multiplayer_modes: [] })).toBe("Not listed by provider");
    expect(getMultiplayerDetails({ multiplayer_modes: [{ online_coop: false }] })).toBe("Not listed by provider");
  });

  it("bases the experience snapshot only on available game metadata", () => {
    expect(getBestFit({
      themes: [{ name: "Survival" }],
      genres: [{ name: "Adventure" }],
      player_perspectives: [{ name: "First person" }],
      game_modes: [{ name: "Single player" }],
    })).toBe("For players seeking Survival themes, Adventure gameplay, First person perspective, Single player play.");
    expect(getBestFit({})).toBe("Not listed by provider");
  });
});
