import { formatTripDate } from "@/lib/utils";
import { Text, View } from "react-native";

export default function CountdownCard({ startDate }: { startDate: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const daysToGo = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <View className="bg-surface rounded-2xl p-8 items-center">
      <Text className="text-textSecondary text-lg tracking-widest mb-2">
        Days to go
      </Text>
      <Text
        className="text-text font-bold"
        style={{ fontSize: 96, lineHeight: 96 }}
      >
        {daysToGo}
      </Text>
      <Text className="text-textSecondary text-sm mt-2">
        {formatTripDate(startDate)}
      </Text>
    </View>
  );
}
