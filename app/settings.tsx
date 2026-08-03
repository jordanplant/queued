import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type ClockFormat = "12hr" | "24hr";
type TempUnit = "C" | "F";

const SettingRow = ({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <View className="flex-row items-center justify-between py-4 border-b border-border">
    <View className="flex-1 mr-4">
      <Text className="text-text text-sm font-medium">{label}</Text>
      {subtitle && (
        <Text className="text-textMuted text-xs mt-0.5">{subtitle}</Text>
      )}
    </View>
    {children}
  </View>
);

const SegmentControl = ({
  options,
  selected,
  onSelect,
  color,
}: {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  color: string;
}) => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  return (
    <View
      className="flex-row rounded-lg overflow-hidden"
      style={{ backgroundColor: theme.elevated }}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          className="px-4 py-2"
          style={{
            backgroundColor: selected === opt ? color : "transparent",
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{
              color:
                selected === opt ? Colors.dark.background : theme.textSecondary,
            }}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function Settings() {
  const { user, setUser } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [clockFormat, setClockFormat] = useState<ClockFormat>("24hr");
  const [tempUnit, setTempUnit] = useState<TempUnit>("C");

  const [dateFormat, setDateFormat] = useState<"DD/MM/YYYY" | "MM/DD/YYYY">(
    "DD/MM/YYYY",
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-surface w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text className="text-text text-2xl font-bold">Settings</Text>
        </View>

        {/* Preferences section */}
        <Text className="text-textMuted text-xs uppercase tracking-widest mb-2">
          Preferences
        </Text>
        <View className="bg-surface rounded-2xl px-4 mb-8">
          <SettingRow
            label="Clock Format"
            subtitle="Affects wait times and showtimes"
          >
            <SegmentControl
              options={["24hr", "12hr"]}
              selected={clockFormat}
              onSelect={(val) => setClockFormat(val as ClockFormat)}
              color={theme.accent}
            />
          </SettingRow>
          <SettingRow label="Temperature" subtitle="Affects weather display">
            <SegmentControl
              options={["°C", "°F"]}
              selected={tempUnit === "C" ? "°C" : "°F"}
              onSelect={(val) => setTempUnit(val === "°C" ? "C" : "F")}
              color={theme.accent}
            />
          </SettingRow>
          <SettingRow label="Date Format" subtitle="Affects trip date display">
            <SegmentControl
              options={["DD/MM", "MM/DD"]}
              selected={dateFormat === "DD/MM/YYYY" ? "DD/MM" : "MM/DD"}
              onSelect={(val) =>
                setDateFormat(val === "DD/MM" ? "DD/MM/YYYY" : "MM/DD/YYYY")
              }
              color={theme.accent}
            />
          </SettingRow>
        </View>

        {/* Account section */}
        <Text className="text-textMuted text-xs uppercase tracking-widest mb-2">
          Account
        </Text>
        <View className="bg-surface rounded-2xl px-4">
          <SettingRow label="Email">
            <Text className="text-textSecondary text-sm">{user?.email}</Text>
          </SettingRow>
        </View>
      </View>
    </ScrollView>
  );
}
