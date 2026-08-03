import AchievementGrid from "@/components/AchievementGrid";
import SwipeableRow from "@/components/SwipeableRow";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { formatShortDate, toDateOnly } from "@/lib/utils";
import { getAllFavourites } from "@/services/favourites";
import { getSnacks } from "@/services/snacks";
import { Trip, deleteTrip, getTrips } from "@/services/trips";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getAvatarColor = (name: string) => {
  const colors = [
    "#00E5FF",
    "#FF6B6B",
    "#FFD700",
    "#7C3AED",
    "#10B981",
    "#F97316",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

type Stats = {
  trips: number;
  snacksSaved: number;
  snacksEaten: number;
  favourites: number;
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [cogOpen, setCogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    getTrips(user.$id)
      .then(setTrips)
      .catch(console.error)
      .finally(() => setTripsLoading(false));

    Promise.all([
      getTrips(user.$id),
      getSnacks(user.$id),
      getAllFavourites(user.$id),
    ])
      .then(([tripsData, snacksData, favouritesData]) => {
        setStats({
          trips: tripsData.length,
          snacksSaved: snacksData.length,
          snacksEaten: snacksData.filter((s) => s.completed).length,
          favourites: favouritesData.length,
        });
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [user]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const { logout } = await import("@/lib/auth");
      await logout();
      setUser(null);
      router.replace("/(auth)/login");
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              setTrips((prev) => prev.filter((t) => t.$id !== tripId));
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  };

  const avatarColor = getAvatarColor(user?.name ?? "");
  const initials = getInitials(user?.name ?? "");

  const getDerivedStatus = (trip: Trip) => {
    const today = toDateOnly(new Date().toISOString());
    if (
      toDateOnly(trip.startDate) <= today &&
      toDateOnly(trip.endDate) >= today
    )
      return "active";
    if (toDateOnly(trip.startDate) > today) return "upcoming";
    return "past";
  };

  const today = toDateOnly(new Date().toISOString());

  const upcomingTrips = trips
    .filter(
      (t) =>
        toDateOnly(t.startDate) > today ||
        (toDateOnly(t.startDate) <= today && toDateOnly(t.endDate) >= today),
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const pastTrips = trips
    .filter((t) => toDateOnly(t.endDate) < today)
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  const sortedTrips = [...upcomingTrips, ...pastTrips];

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <View
      className="rounded-2xl p-4 items-center justify-center"
      style={{ backgroundColor: theme.surface, width: "48%" }}
    >
      {statsLoading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Text className="text-text text-2xl font-bold">{value}</Text>
      )}
      <Text className="text-textSecondary text-xs mt-1 text-center">
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8">
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor }}
            >
              <Text className="text-white text-xl font-bold">{initials}</Text>
            </View>
            <View>
              <Text className="text-text text-xl font-bold">{user?.name}</Text>
            </View>
          </View>

          {/* Cog dropdown */}
          <View>
            <TouchableOpacity
              onPress={() => setCogOpen((o) => !o)}
              className="bg-surface w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {cogOpen && (
              <View
                className="absolute right-0 top-12 rounded-xl overflow-hidden border border-border z-10"
                style={{ backgroundColor: theme.elevated, minWidth: 160 }}
              >
                <TouchableOpacity
                  className="flex-row items-center gap-3 px-4 py-3 border-b border-border"
                  onPress={() => {
                    setCogOpen(false);
                    router.push("/settings");
                  }}
                >
                  <Ionicons
                    name="settings-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text className="text-text text-sm">Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center gap-3 px-4 py-3"
                  onPress={() => {
                    setCogOpen(false);
                    handleLogout();
                  }}
                >
                  {logoutLoading ? (
                    <ActivityIndicator size="small" color="#FF4D4D" />
                  ) : (
                    <Ionicons
                      name="log-out-outline"
                      size={16}
                      color="#FF4D4D"
                    />
                  )}
                  <Text className="text-red-400 text-sm">Log out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-y-3 justify-between mb-8">
          <StatCard label="Trips Planned" value={stats?.trips ?? 0} />
          <StatCard label="Snacks Saved" value={stats?.snacksSaved ?? 0} />
          <StatCard label="Snacks Eaten" value={stats?.snacksEaten ?? 0} />
          <StatCard label="Favourites" value={stats?.favourites ?? 0} />
        </View>

        {/* Trips */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-text text-lg font-semibold">My Trips</Text>
          <TouchableOpacity
            className="bg-accent px-4 py-2 rounded-xl"
            onPress={() => router.push("/trip/new?from=profile")}
          >
            <Text className="text-background font-bold text-sm">
              + New Trip
            </Text>
          </TouchableOpacity>
        </View>

        {tripsLoading ? (
          <ActivityIndicator color={theme.accent} />
        ) : trips.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-textSecondary text-sm text-center">
              No trips yet. Create your first one!
            </Text>
          </View>
        ) : (
          <View>
            {sortedTrips.map((trip, index) => {
              const derivedStatus = getDerivedStatus(trip);
              const isPastDivider =
                index === upcomingTrips.length && pastTrips.length > 0;
              return (
                <View key={trip.$id}>
                  {isPastDivider && (
                    <View className="flex-row items-center gap-3 my-4">
                      <View className="flex-1 h-px bg-border" />
                      <Text className="text-textMuted text-xs">Past trips</Text>
                      <View className="flex-1 h-px bg-border" />
                    </View>
                  )}
                  <SwipeableRow
                    marginBottom={12}
                    actions={[
                      {
                        label: "Edit",
                        color: theme.accent,
                        onPress: () =>
                          router.push(
                            `/trip/${trip.$id}?edit=true&from=profile` as any,
                          ),
                      },
                      {
                        label: "Delete",
                        color: "#EF4444",
                        textColor: "#FFFFFF",
                        onPress: () => handleDelete(trip.$id),
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        router.push(`/trip/${trip.$id}?from=profile` as any)
                      }
                    >
                      {({ pressed }) => (
                        <View
                          style={{
                            backgroundColor: pressed
                              ? theme.border
                              : theme.surface,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 8,
                          }}
                        >
                          {/* Trip name + status badge */}
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-text font-semibold text-base">
                              {trip.name}
                            </Text>
                            {(derivedStatus === "upcoming" ||
                              derivedStatus === "active") && (
                              <View
                                className={`px-2 py-1 rounded-full ${
                                  derivedStatus === "active"
                                    ? "bg-green-500/20"
                                    : "bg-accent/20"
                                }`}
                              >
                                <Text
                                  className="text-xs font-medium"
                                  style={{
                                    color:
                                      derivedStatus === "active"
                                        ? "#10B981"
                                        : theme.accent,
                                  }}
                                >
                                  {derivedStatus}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Dates */}
                          <Text className="text-textSecondary text-sm">
                            {formatShortDate(trip.startDate)} →{" "}
                            {formatShortDate(trip.endDate)}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </SwipeableRow>
                </View>
              );
            })}
          </View>
        )}

        {/* Achievements */}
        <Text className="text-text text-lg font-semibold mb-3 mt-8">
          Achievements
        </Text>
        <AchievementGrid />
        <View className="mb-8" />
      </View>
    </ScrollView>
  );
}
