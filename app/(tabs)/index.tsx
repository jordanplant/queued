import CountdownCard from "@/components/today/CountdownCard";
import DayForecastCard from "@/components/today/DayForecastCard";
import TripHeaderCard from "@/components/today/TripHeaderCard";
import WeatherCard from "@/components/today/WeatherCard";
import Colors from "@/constants/Colors";
import { PARKS, RESORTS } from "@/constants/parks";
import { useAuth } from "@/context/AuthContext";
import { formatShortDate, toDateOnly } from "@/lib/utils";
import { Trip, getTrips } from "@/services/trips";
import {
  DayForecast,
  WeatherData,
  fetchDayForecast,
  fetchWeather,
} from "@/services/weather";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Today() {
  const { user, currentTrip, setCurrentTrip } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dayForecast, setDayForecast] = useState<DayForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Load all trips once for the switcher list
  useEffect(() => {
    if (!user) return;
    getTrips(user.$id)
      .then(setAllTrips)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // React to whichever trip is currently selected
  useEffect(() => {
    if (!currentTrip) return;

    const today = toDateOnly(new Date().toISOString());
    const isActive =
      toDateOnly(currentTrip.startDate) <= today &&
      toDateOnly(currentTrip.endDate) >= today;

    setWeather(null);
    setDayForecast([]);

    const tripParks = PARKS.filter((p) => currentTrip.parks.includes(p.id));
    const coords = RESORTS[tripParks[0]?.resort];
    if (!coords) {
      setWeatherLoading(false);
      setSwitching(false);
      return;
    }

    setWeatherLoading(true);

    if (isActive) {
      fetchWeather(coords.lat, coords.lng, coords.timezone)
        .then(setWeather)
        .catch(console.error)
        .finally(() => {
          setWeatherLoading(false);
          setSwitching(false);
        });
    } else {
      const start = new Date(currentTrip.startDate);
      start.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const daysToGo = Math.ceil(
        (start.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysToGo <= 5) {
        const end = new Date(currentTrip.endDate);
        end.setHours(0, 0, 0, 0);
        const tripLength =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        fetchDayForecast(
          coords.lat,
          coords.lng,
          toDateOnly(currentTrip.startDate),
          Math.min(tripLength, 5),
        )
          .then(setDayForecast)
          .catch(console.error)
          .finally(() => {
            setWeatherLoading(false);
            setSwitching(false);
          });
      } else {
        setWeatherLoading(false);
        setSwitching(false);
      }
    }
  }, [currentTrip]);

  const handleSwitchTrip = (trip: Trip) => {
    setSwitching(true);
    setDropdownOpen(false);
    setCurrentTrip(trip);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // ── no trip ──
  if (!currentTrip) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-text text-2xl font-bold mb-2">Queued</Text>
        <Text className="text-textSecondary text-sm mb-8">
          Your park day, sorted.
        </Text>
        <TouchableOpacity
          className="bg-accent px-6 py-3 rounded-xl"
          onPress={() => router.push("/trip/new")}
        >
          <Text className="text-background font-bold">Plan a trip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const today = toDateOnly(new Date().toISOString());
  const isActive =
    toDateOnly(currentTrip.startDate) <= today &&
    toDateOnly(currentTrip.endDate) >= today;

  // ── trip switcher dropdown ──
  const TripSwitcher = () => (
    <View className="mb-4">
      <TouchableOpacity
        className="flex-row items-center gap-1 self-start"
        onPress={() => setDropdownOpen((o) => !o)}
      >
        <Text className="text-accent text-lg font-semibold">
          {currentTrip.name}
        </Text>
        <Ionicons
          name={dropdownOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.accent}
        />
      </TouchableOpacity>

      {dropdownOpen && (
        <View
          className="mt-2 rounded-xl overflow-hidden border border-border"
          style={{ backgroundColor: theme.elevated }}
        >
          {allTrips.map((trip, index) => {
            const isSelected = trip.$id === currentTrip.$id;
            return (
              <TouchableOpacity
                key={trip.$id}
                className="flex-row items-center justify-between px-4 py-3"
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.border,
                }}
                onPress={() => handleSwitchTrip(trip)}
              >
                <View>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? theme.accent : theme.text }}
                  >
                    {trip.name}
                  </Text>
                  <Text className="text-textMuted text-xs mt-0.5">
                    {formatShortDate(trip.startDate)} →{" "}
                    {formatShortDate(trip.endDate)}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.accent}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  // ── during trip ──
  if (isActive) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="px-6 pt-16 pb-8 gap-3">
          <TripSwitcher />
          <View className="mb-2">
            <Text className="text-accent text-xs uppercase tracking-widest mb-1">
              You're here!
            </Text>
            <Text className="text-text text-3xl font-bold">
              Have a great day 🎉
            </Text>
          </View>

          {switching ? (
            <View
              className="bg-surface rounded-2xl p-5 items-center justify-center"
              style={{ height: 100 }}
            >
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <TripHeaderCard trip={currentTrip} />
          )}

          {weatherLoading && (
            <View className="bg-surface rounded-2xl p-5 items-center">
              <ActivityIndicator color={theme.accent} />
            </View>
          )}
          {weather && !weatherLoading && <WeatherCard weather={weather} />}
        </View>
      </ScrollView>
    );
  }

  // ── pre-trip ──
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8 gap-3">
        <TripSwitcher />

        {switching ? (
          <View
            className="bg-surface rounded-2xl p-5 items-center justify-center"
            style={{ height: 100 }}
          >
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <TripHeaderCard trip={currentTrip} />
        )}

        <CountdownCard startDate={currentTrip.startDate} />

        {weatherLoading && (
          <View className="bg-surface rounded-2xl p-5 items-center">
            <ActivityIndicator color={theme.accent} />
          </View>
        )}
        {dayForecast.length > 2 && !weatherLoading && (
          <DayForecastCard forecasts={dayForecast} />
        )}
      </View>
    </ScrollView>
  );
}
