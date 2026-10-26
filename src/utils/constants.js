import { Heart, Sparkles, UsersRound } from "lucide-react";

const ROOM_THEMES = [
  { id: "LOVE", label: "Love", detail: "A warm little glow for two", icon: Heart },
  { id: "FAMILY", label: "Family", detail: "A cozy night in", icon: UsersRound },
  { id: "FRIENDSHIP", label: "Friendship", detail: "Your movie-night energy", icon: Sparkles },
];
const THEME_REACTIONS = {
  LOVE: ["❤️", "🥰", "😍", "😘", "💖", "✨"],
  FAMILY: ["❤️", "😊", "😂", "👏", "🤗", "👍", "🏠"],
  FRIENDSHIP: ["😂", "🔥", "🤣", "🙌", "😎", "👏", "💀", "🫶"],
};

export { ROOM_THEMES, THEME_REACTIONS };
