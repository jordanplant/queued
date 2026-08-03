import Colors from "@/constants/Colors";
import { WeatherData } from "@/services/weather";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";

const iconFromWeather = (icon: string): keyof typeof Ionicons.glyphMap => {
  const code = icon.replace("d", "").replace("n", "");
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    "01": "sunny",
    "02": "partly-sunny",
    "03": "cloudy",
    "04": "cloudy",
    "09": "rainy",
    "10": "rainy-outline",
    "11": "thunderstorm",
    "13": "snow",
    "50": "water",
  };
  return map[code] ?? "thermometer";
};

const colorFromWeather = (icon: string): string => {
  const code = icon.replace("d", "").replace("n", "");
  const map: Record<string, string> = {
    "01": "#FFD60A",
    "02": "#FFD60A",
    "03": "#9BA3B8",
    "04": "#6B7280",
    "09": "#60A5FA",
    "10": "#93C5FD",
    "11": "#A78BFA",
    "13": "#E0F2FE",
    "50": "#9BA3B8",
  };
  return map[code] ?? "#9BA3B8";
};

export default function WeatherCard({ weather }: { weather: WeatherData }) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View className="bg-surface rounded-2xl p-5">
      <Text className="text-accent text-xs uppercase tracking-widest mb-3">
        Weather
      </Text>

      {/* Current conditions */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Ionicons
            name={iconFromWeather(weather.current.icon)}
            size={48}
            color={colorFromWeather(weather.current.icon)}
          />
          <View>
            <Text className="text-text text-5xl font-bold">
              {weather.current.temp}°
            </Text>
            {weather.nextRain ? (
              <Text className="text-accent text-sm mt-1">
                ☔️ Rain likely at {weather.nextRain.time}
              </Text>
            ) : (
              <Text className="text-textSecondary text-sm mt-1">
                😎 No rain expected
              </Text>
            )}
            <Text className="text-text text-sm font-semibold mt-1">
              Feels like {weather.current.feelsLike}°
              <Text className="text-textMuted text-xs">
                {" "}
                · H:{weather.high}° L:{weather.low}°
              </Text>
            </Text>
          </View>
        </View>
        <View className="items-end gap-2">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="water-outline"
              size={14}
              color={theme.textSecondary}
            />
            <Text className="text-textSecondary text-sm">
              {weather.current.humidity}%
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Feather name="wind" size={14} color={theme.textSecondary} />
            <Text className="text-textSecondary text-sm">
              {weather.current.windSpeed} m/s
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Feather name="sunset" size={14} color={theme.textSecondary} />
            <Text className="text-textSecondary text-sm">{weather.sunset}</Text>
          </View>
        </View>
      </View>

      {/* Named slots */}
      {weather.slots.length > 0 && (
        <View className="flex-row gap-2">
          {weather.slots.map((slot) => (
            <View
              key={slot.label}
              className="flex-1 items-center bg-elevated rounded-xl px-2 py-3"
            >
              <Text
                className="text-textSecondary text-xs mb-2"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {slot.label}
                {slot.label === "Peak" ? ` · ${slot.time}` : ""}
              </Text>
              <Ionicons
                name={iconFromWeather(slot.icon)}
                size={20}
                color={colorFromWeather(slot.icon)}
              />
              <Text className="text-text text-sm font-semibold mt-1">
                {slot.temp}°
              </Text>
              {slot.rainChance > 0 && (
                <Text className="text-accent text-xs mt-1">
                  {slot.rainChance}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
