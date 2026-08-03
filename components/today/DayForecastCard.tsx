import { formatTripDate } from "@/lib/utils";
import { DayForecast } from "@/services/weather";
import { ScrollView, Text, View } from "react-native";

const FORECAST_DAYS = 5;

export default function DayForecastCard({
  forecasts,
}: {
  forecasts: DayForecast[];
}) {
  const displayForecasts = forecasts.slice(0, FORECAST_DAYS);

  return (
    <View className="bg-surface rounded-2xl p-5">
      <Text className="text-accent text-xs uppercase tracking-widest mb-4">
        Trip Day Forecast
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-1"
      >
        {displayForecasts.map((day) => (
          <View
            key={day.date}
            className="items-center bg-elevated rounded-xl px-4 py-3 mx-1 min-w-[80px]"
          >
            <Text className="text-textMuted text-xs mb-2">
              {formatTripDate(day.date)}
            </Text>
            <Text className="text-text text-lg font-bold">{day.high}°</Text>
            {/* <Text className="text-textSecondary text-sm">{day.low}°</Text> */}
            {/* <Text className="text-textMuted text-xs capitalize mt-1 text-center">
              {day.description}
            </Text> */}
            {day.rainChance > 0 ? (
              <Text className="text-accent text-xs mt-1">
                🌧 {day.rainChance}%
              </Text>
            ) : (
              <Text className="text-textSecondary text-xs mt-1">☀️</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
