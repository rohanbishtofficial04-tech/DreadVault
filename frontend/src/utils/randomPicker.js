const normalize = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const gameIdentity = (game) => game?.id ?? game?.slug;

export const filterRandomGames = (games, { genre, platform }) =>
  games.filter((game) => {
    if (genre && !(game.genres || []).some((item) => normalize(item.slug || item.name) === genre)) {
      return false;
    }

    const platforms = game.platforms?.length
      ? game.platforms
      : game.parent_platforms || [];
    return !platform || platforms.some((item) => {
      const entry = item.platform || item;
      return normalize(entry.slug || entry.name) === platform;
    });
  });

export const getRandomCandidates = (games, recentIds = []) => {
  const uniqueGames = Array.from(
    new Map(games.map((game) => [gameIdentity(game), game])).values()
  );
  const recent = new Set(recentIds);
  const unseenGames = uniqueGames.filter((game) => !recent.has(gameIdentity(game)));
  return unseenGames.length ? unseenGames : uniqueGames;
};
