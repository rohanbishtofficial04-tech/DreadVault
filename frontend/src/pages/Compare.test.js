import {
  getBestFit,
  getContentAdvisories,
  getMultiplayerDetails,
} from "../utils/compare";

describe("comparison metadata", () => {
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
