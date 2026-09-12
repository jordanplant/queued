export const toDateOnly = (iso: string) => iso.split("T")[0];

export const formatTripDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";

export const formatShortDate = (iso: string, dateFormat: DateFormat) => {
  const [year, month, day] = iso.split("T")[0].split("-");
  return dateFormat === "MM/DD/YYYY"
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;
};

export type ClockFormat = "12hr" | "24hr";

export const formatClockTime = (
  hour: number,
  minute: number,
  clockFormat: ClockFormat,
) => {
  const mins = String(minute).padStart(2, "0");
  if (clockFormat === "24hr") {
    return `${String(hour).padStart(2, "0")}:${mins}`;
  }
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${mins} ${period}`;
};

export type TempUnit = "C" | "F";

export const convertTemp = (celsius: number, tempUnit: TempUnit) => {
  const value = tempUnit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(value);
};

export const convertWindSpeed = (mps: number, tempUnit: TempUnit) => {
  const value = tempUnit === "F" ? mps * 2.23694 : mps;
  return Math.round(value);
};
