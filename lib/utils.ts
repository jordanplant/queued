export const toDateOnly = (iso: string) => iso.split("T")[0];

export const formatTripDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
