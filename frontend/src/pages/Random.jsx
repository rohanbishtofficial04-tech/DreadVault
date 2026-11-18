import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBrowse,
  getGenres,
  getPlatforms,
  getRecent,
  getUpcoming,
} from "@/services/games";
import { useLibrary } from "@/context/LibraryContext";
import { TID } from "@/constants/testIds";
import { Skull, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { RatingBadge } from "@/components/RatingBadge";
import { PlatformBadges } from "@/components/PlatformBadges";
import { formatYear, stripHtml, clampText } from "@/utils/format";
import { selectBrowseGenres, selectPopularGenres, selectPopularPlatforms } from "@/utils/popularCatalog";
import { filterRandomGames, getRandomCandidates } from "@/utils/randomPicker";

const RECENT_PICK_LIMIT = 5;
const POOLS = [
  { value: "all", label: "All Horror (mixed pool)" },
  { value: "trending", label: "Trending Horror" },
  { value: "top-rated", label: "Top-Rated Horror" },
  { value: "recent", label: "Recently Released Horror" },
  { value: "upcoming", label: "Upcoming Horror" },
  { value: "favorites", label: "My Favorites" },
];

export default function Random() {
  const { favorites } = useLibrary();
  const [rolling, setRolling] = useState(false);
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [pool, setPool] = useState("all");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const recentPickIds = useRef([]);

  useEffect(() => {
    let active = true;
    const loadFilters = async () => {
      const [genresResult, platformsResult] = await Promise.allSettled([
        getGenres(),
        getPlatforms(),
      ]);
      if (!active) return;

      const errors = [];
      if (genresResult.status === "fulfilled") {
        setGenres(genresResult.value?.results || []);
      } else {
        console.error("Unable to load random-picker genres.", genresResult.reason);
        errors.push("genres");
      }
      if (platformsResult.status === "fulfilled") {
        setPlatforms(platformsResult.value?.results || []);
      } else {
        console.error("Unable to load random-picker platforms.", platformsResult.reason);
        errors.push("platforms");
      }
      if (errors.length) setCatalogError(`Unable to load ${errors.join(" and ")} filters.`);
    };
    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  const genreOptions = useMemo(() => {
    const browseGenres = selectBrowseGenres(genres);
    return selectPopularGenres(browseGenres);
  }, [genres]);
  const platformOptions = useMemo(
    () => selectPopularPlatforms(platforms),
    [platforms]
  );
  const selectedGenre = genreOptions.find((item) => item.slug === genre);
  const selectedPlatform = platformOptions.find((item) => item.slug === platform);

  const updateCriteria = (update) => {
    update();
    setGame(null);
    setError("");
  };

  const roll = async () => {
    setRolling(true);
    setError("");
    try {
      let games;
      if (pool === "favorites") {
        games = filterRandomGames(favorites, { genre, platform });
      } else if (pool === "all") {
        const params = { page_size: 40, genre: genre || undefined, platform: platform || undefined };
        const [trending, topRated, recent, upcoming] = await Promise.all([
          getBrowse({ ...params, ordering: "-added" }),
          getBrowse({ ...params, ordering: "-rating" }),
          getRecent(params),
          getUpcoming(params),
        ]);
        games = filterRandomGames(
          [trending, topRated, recent, upcoming].flatMap((data) => data?.results || []),
          { genre, platform }
        );
      } else {
        const params = { page_size: 40, genre: genre || undefined, platform: platform || undefined };
        const data = pool === "recent"
          ? await getRecent(params)
          : pool === "upcoming"
            ? await getUpcoming(params)
            : await getBrowse({
              ...params,
              ordering: pool === "top-rated" ? "-rating" : "-added",
            });
        games = filterRandomGames(data?.results || [], { genre, platform });
      }
      const candidates = getRandomCandidates(games, recentPickIds.current);
      if (!candidates.length) {
        setGame(null);
        setError(
          pool === "favorites" && favorites.length === 0
            ? "Your Favorites are empty. Save a game first."
            : "No games match those filters. Try changing your selection."
        );
        return;
      }
      await new Promise((res) => setTimeout(res, 1400));
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      const pickedId = picked.id ?? picked.slug;
      recentPickIds.current = [
        ...recentPickIds.current.filter((id) => id !== pickedId),
        pickedId,
      ].slice(-RECENT_PICK_LIMIT);
      setGame(picked);
    } catch (requestError) {
      console.error("Unable to load games for the random picker.", requestError);
      setGame(null);
      setError("Unable to load games. Please try again later.");
    } finally {
      setRolling(false);
    }
  };

  return (
    <div data-testid={TID.randomPage} className="max-w-[1440px] mx-auto px-6 md:px-10 pt-14 pb-24">
      <div className="mb-10">
        <p className="font-brand text-[11px] tracking-[0.2em] text-[color:var(--nf-text-dim)]">Dare</p>
        <h1 className="font-display text-5xl md:text-6xl mt-1 tracking-tight">Random Horror</h1>
        <p className="mt-3 text-[color:var(--nf-text-dim)] text-sm max-w-xl">
          Set the mood, choose your platform, or let the vault surprise you.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block font-brand text-[10px] tracking-[0.2em] text-[color:var(--nf-text-dim)]">
            GAME POOL
          </span>
          <select
            data-testid={TID.randomPool}
            value={pool}
            onChange={(event) => updateCriteria(() => setPool(event.target.value))}
            disabled={rolling}
            className="w-full border border-[color:var(--nf-border)] bg-[color:var(--nf-surface)] px-3 py-3 text-sm outline-none focus:border-[color:var(--nf-accent)]"
          >
            {POOLS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block font-brand text-[10px] tracking-[0.2em] text-[color:var(--nf-text-dim)]">
            GENRE
          </span>
          <select
            data-testid={TID.randomGenre}
            value={genre}
            onChange={(event) => updateCriteria(() => setGenre(event.target.value))}
            disabled={rolling}
            className="w-full border border-[color:var(--nf-border)] bg-[color:var(--nf-surface)] px-3 py-3 text-sm outline-none focus:border-[color:var(--nf-accent)]"
          >
            <option value="">Any genre</option>
            {genreOptions.filter((item) => item.slug).map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block font-brand text-[10px] tracking-[0.2em] text-[color:var(--nf-text-dim)]">
            PLATFORM
          </span>
          <select
            data-testid={TID.randomPlatform}
            value={platform}
            onChange={(event) => updateCriteria(() => setPlatform(event.target.value))}
            disabled={rolling}
            className="w-full border border-[color:var(--nf-border)] bg-[color:var(--nf-surface)] px-3 py-3 text-sm outline-none focus:border-[color:var(--nf-accent)]"
          >
            <option value="">Any platform</option>
            {platformOptions.filter((item) => item.slug).map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>
      {catalogError && (
        <p role="status" className="mb-4 text-xs text-[color:var(--nf-text-dim)]">{catalogError}</p>
      )}

      <div className="flex flex-col items-center justify-center min-h-[420px] border border-[color:var(--nf-border)] bg-[color:var(--nf-surface)] p-8 md:p-16 text-center relative overflow-hidden">
        <div className="nf-fog" />
        <AnimatePresence mode="wait">
          {rolling ? (
            <motion.div
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <motion.div
                animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Skull className="h-24 w-24 mx-auto text-[color:var(--nf-accent)]" strokeWidth={1.2} />
              </motion.div>
              <p className="mt-6 font-brand text-xs tracking-[0.4em] text-[color:var(--nf-text-dim)]">
                Summoning…
              </p>
            </motion.div>
          ) : game ? (
            <motion.div
              key={game.id}
              data-testid={TID.randomResult}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-2xl"
            >
              <div className="relative aspect-[16/9] mb-6 overflow-hidden border border-[color:var(--nf-border)]">
                <img src={game.background_image} alt={game.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>
              <p className="font-brand text-[11px] tracking-[0.3em] text-[color:var(--nf-accent)]">
                Your fate · {formatYear(game.released)}
              </p>
              <h2 className="font-display text-4xl md:text-5xl mt-2">{game.name}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3 justify-center">
                <RatingBadge
                  value={game.rating}
                  metacritic={game.metacritic}
                  criticRating={game.critic_rating}
                  provider={game.provider}
                  compact
                />
                <PlatformBadges platforms={game.parent_platforms} />
              </div>
              <p className="mt-4 text-sm text-[color:var(--nf-text-dim)] max-w-lg mx-auto">
                {clampText(stripHtml(game.description_raw || ""), 200) ||
                  (game.genres || []).map((g) => g.name).join(" · ")}
              </p>
              <div data-testid={TID.randomWhy} className="mt-5 border border-[color:var(--nf-border)] bg-black/30 px-4 py-3 text-left">
                <p className="font-brand text-[9px] tracking-[0.2em] text-[color:var(--nf-accent)]">
                  WHY THIS PICK?
                </p>
                <p className="mt-1 text-xs text-[color:var(--nf-text-dim)]">
                  Drawn from {POOLS.find((option) => option.value === pool)?.label || "the horror vault"}.
                  {genre
                    ? ` Matches ${selectedGenre?.name || "your genre"}`
                    : game.genres?.length
                      ? ` Tagged ${game.genres.slice(0, 2).map((item) => item.name).join(", ")}`
                      : ""}
                  {platform ? ` · Available on ${selectedPlatform?.name || "your platform"}` : ""}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link to={`/game/${game.slug}`} className="nf-btn nf-btn-primary">
                  <Play className="h-3.5 w-3.5" /> View details
                </Link>
                <button onClick={roll} className="nf-btn">
                  Roll again
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="relative">
              {error && <p role="status" className="mb-5 text-sm text-[color:var(--nf-text-dim)]">{error}</p>}
              <motion.button
                key="idle"
                data-testid={TID.randomRollBtn}
                onClick={roll}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="nf-btn nf-btn-primary text-base px-8 py-4"
              >
                <Skull className="h-4 w-4" /> Dare to Play
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
