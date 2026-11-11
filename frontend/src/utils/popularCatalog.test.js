import { selectBrowseGenres } from "./popularCatalog";

describe("browse genre options", () => {
  it("omits Horror while keeping the other genres", () => {
    const genres = [
      { id: 1, slug: "horror", name: "Horror" },
      { id: 2, slug: "action", name: "Action" },
      { id: 3, slug: "adventure", name: "Adventure" },
    ];

    expect(selectBrowseGenres(genres)).toEqual(genres.slice(1));
  });

  it("recognizes Horror by its name or slug regardless of capitalization", () => {
    expect(selectBrowseGenres([
      { id: 1, slug: "thriller", name: "hOrRoR" },
      { id: 2, slug: "Horror", name: "Other" },
      { id: 3, slug: "survival", name: "Survival" },
    ])).toEqual([{ id: 3, slug: "survival", name: "Survival" }]);
  });
});
