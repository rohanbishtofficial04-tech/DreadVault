import axios from "axios";
import MOCK from "./mockData";

const configuredBackendUrl = (process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/+$/, "");
const backendUrl = (() => {
  if (!configuredBackendUrl || typeof window === "undefined") return configuredBackendUrl;

  try {
    const url = new URL(configuredBackendUrl);
    const localHosts = ["localhost", "127.0.0.1", "::1"];
    if (localHosts.includes(url.hostname) && !localHosts.includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return configuredBackendUrl;
  }
})();
const usingMock = !backendUrl;
const API_BASE = `${backendUrl}/api`;
const SPORTS_NAME_PATTERN = /\b(?:efootball|fifa|football|soccer|foosball|basketball|baseball|hockey|tennis|golf|rugby|wrestling|motorsport|racing|formula [1-9]|pes)\b/i;

export const isMockMode = () => usingMock;

const request = async (path, params) => {
  const { data } = await axios.get(`${API_BASE}${path}`, { params, timeout: 15000 });
  return data;
};

const normalizeSearch = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const rankSearchResults = (data, query) => {
  const normalizedQuery = normalizeSearch(query);
  const results = [...(data?.results || [])]
    .filter((game) => {
      const categories = [...(game.genres || []), ...(game.tags || [])];
      const hasSportsCategory = categories.some((item) =>
        [item?.slug, item?.name].some((value) =>
          String(value || "").toLowerCase().includes("sport")
        )
      );
      return !hasSportsCategory && !SPORTS_NAME_PATTERN.test(game.name || "");
    })
    .sort((a, b) => {
      const aName = normalizeSearch(a.name);
      const bName = normalizeSearch(b.name);
      const aExact = aName === normalizedQuery ? 0 : 1;
      const bExact = bName === normalizedQuery ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return Number(bName.startsWith(normalizedQuery)) - Number(aName.startsWith(normalizedQuery));
    });
  return { ...(data || {}), count: results.length, results };
};

const dateEra = (release) => Math.floor(Number(String(release || "").slice(0, 4)) / 5);

const rankRelated = (games, game) => {
  const genreIds = new Set((game?.genres || []).map((item) => item.slug || item.name));
  const platformIds = new Set((game?.parent_platforms || game?.platforms || []).map((item) =>
    item.platform?.id ?? item.platform?.slug ?? item.id
  ).filter(Boolean));
  const targetEra = dateEra(game?.released);

  return [...games]
    .filter((item) => item.id !== game?.id && item.slug !== game?.slug)
    .map((item, index) => {
      const genres = (item.genres || []).map((genre) => genre.slug || genre.name);
      const platforms = (item.parent_platforms || item.platforms || []).map((entry) =>
        entry.platform?.id ?? entry.platform?.slug ?? entry.id
      ).filter(Boolean);
      const genreScore = genres.filter((genre) => genreIds.has(genre)).length;
      const platformScore = platforms.filter((platform) => platformIds.has(platform)).length;
      const eraScore = targetEra && dateEra(item.released) === targetEra ? 1 : 0;
      return {
        item,
        score: genreScore * 10 + platformScore * 3 + eraScore,
        index,
      };
    })
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.item.rating || 0) - Number(a.item.rating || 0) ||
      a.index - b.index
    )
    .map(({ item }) => item);
};

export const getTrending = (params = {}) =>
  usingMock ? MOCK.trending(params) : request("/games/trending", params);
export const getTrendingHorror = () =>
  usingMock ? MOCK.trendingHorror() : request("/games/trending-horror");
export const getTopRated = (params = {}) =>
  usingMock ? MOCK.topRated(params) : request("/games/top-rated", params);
export const getTopNightmares = () =>
  usingMock ? MOCK.topNightmares() : request("/games/top-nightmares");
export const getRecent = (params = {}) =>
  usingMock ? MOCK.recent(params) : request("/games/recent", params);
export const getUpcoming = (params = {}) =>
  usingMock ? MOCK.upcoming(params) : request("/games/upcoming", params);
export const getFeaturedGames = () =>
  usingMock
    ? MOCK.featuredGames()
    : request("/games/featured");
export const getSearch = (params = {}) =>
  usingMock
    ? Promise.resolve(rankSearchResults(
      MOCK.browse({ search: params.query, page_size: params.page_size }),
      params.query
    ))
    : request("/games/search", params);
export const getBrowse = (params = {}) =>
  usingMock ? MOCK.browse(params) : request("/games/browse", params);
export const getDetails = (slug) =>
  usingMock ? MOCK.details(slug) : request(`/games/${encodeURIComponent(slug)}`);
export const getScreenshots = (slug) =>
  usingMock ? MOCK.screenshots(slug) : request(`/games/${encodeURIComponent(slug)}/screenshots`);
export const getMovies = (slug) =>
  usingMock ? MOCK.movies() : request(`/games/${encodeURIComponent(slug)}/movies`);
export const getRelated = async (slug, game) => {
  const data = usingMock
    ? MOCK.related(game)
    : await request(`/games/${encodeURIComponent(slug)}/related`);
  return { ...data, results: rankRelated(data?.results || [], game).slice(0, 8) };
};
export const getSeries = (slug, game) =>
  usingMock
    ? Promise.resolve(MOCK.series?.(game) || { count: 0, results: [] })
    : request(`/games/${encodeURIComponent(slug)}/series`);
export const getGenres = () =>
  usingMock ? MOCK.genres() : request("/genres");
export const getPlatforms = () =>
  usingMock ? MOCK.platforms() : request("/platforms");
