const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY!;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export type WeatherCondition = {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

export type NamedSlot = {
  label: "AM" | "Midday" | "Peak" | "PM";
  time: string;
  temp: number;
  description: string;
  icon: string;
  rainChance: number;
};

export type WeatherData = {
  current: WeatherCondition;
  slots: NamedSlot[];
  high: number;
  low: number;
  sunset: string;
  nextRain: { time: string; chance: number } | null;
};

export type DayForecast = {
  date: string;
  high: number;
  low: number;
  rainChance: number;
  description: string;
  icon: string;
};

const formatUnixTime = (unix: number, timezone: string): string =>
  new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

const pickSlot = (slots: any[], targetHour: number, timezone: string): any => {
  return slots.reduce((best, slot) => {
    const slotHour = parseInt(
      new Date(slot.dt * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: timezone,
      }),
    );
    const bestHour = parseInt(
      new Date(best.dt * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: timezone,
      }),
    );
    return Math.abs(slotHour - targetHour) < Math.abs(bestHour - targetHour)
      ? slot
      : best;
  });
};

const shapeSlot = (
  slot: any,
  label: NamedSlot["label"],
  timezone: string,
): NamedSlot => ({
  label,
  time: formatUnixTime(slot.dt, timezone),
  temp: Math.round(slot.main.temp),
  description: slot.weather[0].description,
  icon: slot.weather[0].icon,
  rainChance: Math.round((slot.pop ?? 0) * 100),
});

export const fetchWeather = async (
  lat: number,
  lng: number,
  timezone: string,
): Promise<WeatherData> => {
  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`,
    ),
    fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`,
    ),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("Failed to fetch weather");
  }

  const current = await currentRes.json();
  const forecast = await forecastRes.json();

  const now = Date.now() / 1000;

  // Full day slots for high/low — matched against park local date
  const parkDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: timezone,
  });
  const tomorrowDateStr = new Date(Date.now() + 86400000).toLocaleDateString(
    "en-CA",
    { timeZone: "UTC" },
  );
  const allDaySlots = forecast.list.filter(
    (slot: any) =>
      slot.dt_txt.startsWith(parkDateStr) ||
      slot.dt_txt.startsWith(tomorrowDateStr),
  );
  const dayTemps = allDaySlots.map((s: any) => s.main.temp);

  // Future slots only — next 12 hours for named slot logic
  const slots = forecast.list.filter(
    (slot: any) => slot.dt > now && slot.dt < now + 12 * 60 * 60,
  );

  // Current park time
  const nowDate = new Date();
  const parkHour = parseInt(
    nowDate.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }),
  );
  const parkMinute = parseInt(
    nowDate.toLocaleString("en-US", {
      timeZone: timezone,
      minute: "2-digit",
    }),
  );
  const parkTotalMinutes = parkHour * 60 + parkMinute;

  const peakSlot =
    slots.length > 0
      ? slots.reduce((best: any, s: any) =>
          s.main.temp > best.main.temp ? s : best,
        )
      : null;
  const peakSlotExpiry = peakSlot ? peakSlot.dt + 30 * 60 : 0;

  const namedSlots: NamedSlot[] = [];

  if (slots.length > 0 && parkTotalMinutes < 21 * 60) {
    // AM — hide after 12:00 park time
    if (parkTotalMinutes < 12 * 60) {
      namedSlots.push(shapeSlot(pickSlot(slots, 9, timezone), "AM", timezone));
    }

    // Midday — hide after 15:00 park time
    if (parkTotalMinutes < 15 * 60) {
      namedSlots.push(
        shapeSlot(pickSlot(slots, 12, timezone), "Midday", timezone),
      );
    }

    // Peak — hide 30 mins after peak slot time
    if (peakSlot && now < peakSlotExpiry) {
      namedSlots.push(shapeSlot(peakSlot, "Peak", timezone));
    }

    // PM — hide after 21:00 park time, and only if other slots exist
    if (parkTotalMinutes < 21 * 60 && namedSlots.length > 0) {
      namedSlots.push(shapeSlot(pickSlot(slots, 18, timezone), "PM", timezone));
    }
  }

  const nextRainSlot = namedSlots.find((slot) => slot.rainChance >= 40) ?? null;

  return {
    current: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed),
    },
    slots: namedSlots,
    high: dayTemps.length
      ? Math.round(Math.max(...dayTemps))
      : Math.round(current.main.temp),
    low: dayTemps.length
      ? Math.round(Math.min(...dayTemps))
      : Math.round(current.main.temp),
    sunset: formatUnixTime(current.sys.sunset, timezone),
    nextRain: nextRainSlot
      ? { time: nextRainSlot.time, chance: nextRainSlot.rainChance }
      : null,
  };
};

export const fetchDayForecast = async (
  lat: number,
  lng: number,
  startDate: string,
  days: number = 5,
): Promise<DayForecast[]> => {
  const res = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`,
  );

  if (!res.ok) throw new Error("Failed to fetch forecast");

  const data = await res.json();

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return dates
    .map((date) => {
      const slots = data.list.filter((slot: any) =>
        slot.dt_txt.startsWith(date),
      );
      if (slots.length === 0) return null;

      const temps = slots.map((s: any) => s.main.temp);
      const maxRain = Math.max(
        ...slots.map((s: any) => Math.round((s.pop ?? 0) * 100)),
      );
      const midSlot = slots[Math.floor(slots.length / 2)];

      return {
        date,
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        rainChance: maxRain,
        description: midSlot.weather[0].description,
        icon: midSlot.weather[0].icon,
      };
    })
    .filter(Boolean) as DayForecast[];
};
