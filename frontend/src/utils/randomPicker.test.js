import { filterRandomGames, getRandomCandidates } from "./randomPicker";

describe("random game picker", () => {
  it("applies genre and platform filters together", () => {
    const games = [
      { id: 1, genres: [{ slug: "survival" }], parent_platforms: [{ platform: { slug: "pc" } }] },
      { id: 2, genres: [{ slug: "survival" }], parent_platforms: [{ platform: { slug: "xbox" } }] },
      { id: 3, genres: [{ slug: "action" }], parent_platforms: [{ platform: { slug: "pc" } }] },
    ];

    expect(filterRandomGames(games, { genre: "survival", platform: "pc" }).map((game) => game.id))
      .toEqual([1]);
  });

  it("prefers games not picked recently and de-duplicates candidates", () => {
    const games = [{ id: 1 }, { id: 2 }, { id: 2 }];

    expect(getRandomCandidates(games, [1]).map((game) => game.id)).toEqual([2]);
    expect(getRandomCandidates([{ id: 1 }], [1]).map((game) => game.id)).toEqual([1]);
  });
});
