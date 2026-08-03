import { PARKS } from "@/constants/parks";
import { Trip } from "@/services/trips";
import { Text, View } from "react-native";

const formatList = (items: string[]) => {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} & ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
};

export default function TripHeaderCard({ trip }: { trip: Trip }) {
  const tripParks = PARKS.filter((p) => trip.parks.includes(p.id));
  const tripResorts = [...new Set(tripParks.map((p) => p.resort))];

  return (
    <View className="bg-surface rounded-2xl p-5">
      <Text className="text-text text-2xl font-bold mb-1">
        {formatList(tripResorts)}
      </Text>
      <View className="flex-row flex-wrap gap-2 mt-2">
        {tripParks.map((park) => (
          <View
            key={park.id}
            style={{ backgroundColor: park.color }}
            className="px-3 py-1 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {park.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
