export const NOT_LISTED = "Not listed by provider";

const uniqueNames = (items) =>
  [...new Set((items || []).map((item) => item?.name || item).filter(Boolean))];

export const getContentAdvisories = (game) => {
  const descriptors = uniqueNames(
    (game?.age_ratings || []).flatMap((rating) => rating.descriptors || [])
      .map((descriptor) => descriptor?.description || descriptor?.name || descriptor)
  );
  if (descriptors.length) return descriptors.join(", ");
  return game?.age_ratings?.length ? "No descriptors listed" : NOT_LISTED;
};

export const getMultiplayerDetails = (game) => {
  const modes = game?.multiplayer_modes || [];
  if (!modes.length) return NOT_LISTED;

  const details = [];
  modes.forEach((mode) => {
    const add = (condition, label, max) => {
      if (!condition) return;
      details.push(`${label}${max ? ` (up to ${max})` : ""}`);
    };

    add(mode.online_coop, "Online co-op", mode.online_coop_max);
    add(mode.offline_coop, "Offline co-op", mode.offline_coop_max);
    add(mode.campaign_coop, "Campaign co-op");
    add(mode.drop_in, "Drop-in co-op");
    add(mode.online_max > 1, "Online multiplayer", mode.online_max);
    add(mode.offline_max > 1, "Local multiplayer", mode.offline_max);
    add(mode.split_screen, "Split-screen");
    add(mode.split_screen_online, "Online split-screen");
  });

  return uniqueNames(details).join(", ") || "No multiplayer modes listed";
};

export const getBestFit = (game) => {
  if (!game) return NOT_LISTED;
  const themes = uniqueNames(game.themes);
  const genres = uniqueNames(game.genres).filter((genre) => !themes.includes(genre));
  const perspectives = uniqueNames(game.player_perspectives);
  const modes = uniqueNames(game.game_modes);
  const details = [];

  if (themes.length) details.push(`${themes.slice(0, 2).join(" / ")} themes`);
  if (genres.length) details.push(`${genres.slice(0, 2).join(" / ")} gameplay`);
  if (perspectives.length) details.push(`${perspectives[0]} perspective`);
  if (modes.length) details.push(`${modes.slice(0, 2).join(" / ")} play`);

  return details.length ? `For players seeking ${details.join(", ")}.` : NOT_LISTED;
};
