export type Achievement = {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_in_line",
    icon: "🎢",
    name: "First in Line",
    description: "Log your first ride",
    unlocked: false,
  },
  {
    id: "snack_hunter",
    icon: "🍦",
    name: "Snack Hunter",
    description: "Save 10 snacks to your list",
    unlocked: false,
  },
  {
    id: "park_hopper",
    icon: "🗺️",
    name: "Park Hopper",
    description: "Visit 3 or more parks across your trips",
    unlocked: false,
  },
];
