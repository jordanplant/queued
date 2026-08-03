import Colors from "@/constants/Colors";
import { ACHIEVEMENTS, Achievement } from "@/constants/achievements";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

export default function AchievementGrid() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const [selected, setSelected] = useState<Achievement | null>(null);

  return (
    <>
      <View className="flex-row flex-wrap gap-x-4 gap-y-4">
        {ACHIEVEMENTS.map((a) => (
          <TouchableOpacity
            key={a.id}
            onPress={() => setSelected(a)}
            className="items-center"
            style={{ width: "29%" }}
          >
            <View
              className="rounded-full items-center justify-center mb-2"
              style={{
                backgroundColor: theme.surface,
                width: 80,
                height: 80,
              }}
            >
              <Text style={{ fontSize: 28, opacity: a.unlocked ? 1 : 0.3 }}>
                {a.icon}
              </Text>
            </View>
            <Text
              className="text-xs text-center"
              style={{ color: a.unlocked ? theme.text : theme.textMuted }}
              numberOfLines={2}
            >
              {a.name}
            </Text>
            {!a.unlocked && (
              <Ionicons
                name="lock-closed"
                size={10}
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-8"
          onPress={() => setSelected(null)}
        >
          <Pressable onPress={() => {}}>
            <View
              className="rounded-2xl p-6 items-center"
              style={{ backgroundColor: theme.surface, minWidth: 260 }}
            >
              <Text
                style={{ fontSize: 48, opacity: selected?.unlocked ? 1 : 0.3 }}
              >
                {selected?.icon}
              </Text>
              {!selected?.unlocked && (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={theme.textMuted}
                  style={{ marginTop: 4 }}
                />
              )}
              <Text className="text-text text-lg font-bold mt-3 text-center">
                {selected?.name}
              </Text>
              <Text className="text-textSecondary text-sm text-center mt-2">
                {selected?.description}
              </Text>
              {!selected?.unlocked && (
                <Text className="text-textMuted text-xs mt-3">
                  Not yet unlocked
                </Text>
              )}
              <TouchableOpacity
                onPress={() => setSelected(null)}
                className="mt-5 px-6 py-2 rounded-xl"
                style={{ backgroundColor: theme.elevated }}
              >
                <Text className="text-textSecondary text-sm">Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
