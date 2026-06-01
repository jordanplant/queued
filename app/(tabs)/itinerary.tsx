import Colors from "@/constants/Colors";
import { PARKS } from "@/constants/parks";
import { useAuth } from "@/context/AuthContext";
import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryItem } from "@/services/itinerary";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

const HOUR_HEIGHT = 60;
const TIMELINE_START = 8;
const TIMELINE_END = 23;
const LABEL_WIDTH = 52;
const CONFLICT_THRESHOLD = 0.5;

const minutesToY = (minutes: number, timelineStart: number) => {
  const startMinutes = timelineStart * 60;
  return ((minutes - startMinutes) / 60) * HOUR_HEIGHT;
};

const durationToHeight = (startMinutes: number, endMinutes: number) => {
  return ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
};

const blockEndTime = (duration: string): number => {
  switch (duration) {
    case "full":
      return TIMELINE_END * 60;
    case "am":
      return 13 * 60;
    case "pm":
      return TIMELINE_END * 60;
    default:
      return TIMELINE_END * 60;
  }
};

const blockStartTime = (duration: string): number => {
  switch (duration) {
    case "pm":
      return 13 * 60;
    default:
      return TIMELINE_START * 60;
  }
};

const formatTime = (minutes: number) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const formatHourLabel = (hour: number) => {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
};

const getOverlapRegions = (
  blocks: { time: number; endTime?: number }[],
  timelineStart: number
) => {
  const regions: { top: number; height: number }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const aStart = blocks[i].time;
      const aEnd = blocks[i].endTime ?? blocks[i].time + 60;
      const bStart = blocks[j].time;
      const bEnd = blocks[j].endTime ?? blocks[j].time + 60;
      const overlapStart = Math.max(aStart, bStart);
      const overlapEnd = Math.min(aEnd, bEnd);
      if (overlapEnd > overlapStart) {
        regions.push({
          top: minutesToY(overlapStart, timelineStart),
          height: durationToHeight(overlapStart, overlapEnd),
        });
      }
    }
  }
  return regions;
};

type ConflictResult = {
  block: ItineraryItem;
  overlapMinutes: number;
  overlapRatio: number;
  adjustedStart: number;
  adjustedEnd: number;
  canAdjust: boolean;
} | null;

const findConflict = (
  blocks: ItineraryItem[],
  newStart: number,
  newEnd: number,
  excludeId?: string
): ConflictResult => {
  for (const block of blocks) {
    if (excludeId && block.$id === excludeId) continue;
    const bStart = block.time;
    const bEnd = block.endTime ?? block.time + 60;
    const overlapStart = Math.max(newStart, bStart);
    const overlapEnd = Math.min(newEnd, bEnd);
    if (overlapEnd <= overlapStart) continue;

    const overlapMinutes = overlapEnd - overlapStart;
    const shorterDuration = Math.min(newEnd - newStart, bEnd - bStart);
    const overlapRatio = overlapMinutes / shorterDuration;

    if (overlapRatio > CONFLICT_THRESHOLD) {
      const portionBefore = overlapStart - bStart;
      const portionAfter = bEnd - overlapEnd;

      let adjustedStart: number;
      let adjustedEnd: number;
      let canAdjust = true;

      if (portionAfter >= portionBefore && portionAfter > 0) {
        adjustedStart = overlapEnd;
        adjustedEnd = bEnd;
      } else if (portionBefore > 0) {
        adjustedStart = bStart;
        adjustedEnd = overlapStart;
      } else {
        canAdjust = false;
        adjustedStart = bStart;
        adjustedEnd = bEnd;
      }

      return {
        block,
        overlapMinutes,
        overlapRatio,
        adjustedStart,
        adjustedEnd,
        canAdjust,
      };
    }
  }
  return null;
};

export default function ItineraryScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const {
    activeTrip,
    grouped,
    loading,
    addItem,
    updateItem,
    updateAndAddItem,
    removeAndAddItem,
    removeItem,
  } = useItinerary();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"block" | "event">("event");
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [conflict, setConflict] = useState<ConflictResult>(null);

  const [itemName, setItemName] = useState("");
  const [itemParkId, setItemParkId] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [parkPickerVisible, setParkPickerVisible] = useState(false);

  const [itemTime, setItemTime] = useState<number | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const [blockDuration, setBlockDuration] = useState<
    "full" | "am" | "pm" | "specific"
  >("full");
  const [blockStart, setBlockStart] = useState<number | null>(null);
  const [blockEnd, setBlockEnd] = useState<number | null>(null);
  const [blockStartPickerVisible, setBlockStartPickerVisible] = useState(false);
  const [blockEndPickerVisible, setBlockEndPickerVisible] = useState(false);

  const [earlierHours, setEarlierHours] = useState(0);
  const [laterHours, setLaterHours] = useState(0);

  const timelineStart = TIMELINE_START - earlierHours;
  const timelineEnd = TIMELINE_END + laterHours;
  const totalHours = timelineEnd - timelineStart;
  const canvasHeight = totalHours * HOUR_HEIGHT;
  const hours = Array.from({ length: totalHours }, (_, i) => timelineStart + i);

  const scrollRef = useRef<ScrollView>(null);

  const getTripDates = () => {
    if (!activeTrip) return [];
    const dates: string[] = [];
    const current = new Date(activeTrip.startDate.split("T")[0] + "T00:00:00");
    const end = new Date(activeTrip.endDate.split("T")[0] + "T00:00:00");
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const tripDates = getTripDates();

  useEffect(() => {
    if (tripDates.length > 0 && !selectedDate) {
      setSelectedDate(tripDates[0]);
    }
  }, [activeTrip]);

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return {
      day: date.toLocaleDateString("en-GB", { weekday: "short" }),
      num: date.getDate(),
    };
  };

  const selectedItems = selectedDate ? grouped[selectedDate] ?? [] : [];
  const blocks = selectedItems.filter((i) => i.itemType === "block");
  const events = selectedItems.filter((i) => i.itemType === "event");
  const selectedPark = PARKS.find((p) => p.id === itemParkId);

  useEffect(() => {
    if (selectedItems.length === 0) return;
    const earliest = Math.min(...selectedItems.map((i) => i.time));
    const y = minutesToY(earliest, timelineStart);
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 40), animated: true }),
      100
    );
  }, [selectedDate]);

  const openEditModal = (item: ItineraryItem) => {
    setEditingItem(item);
    setConflict(null);
    setModalType(item.itemType);
    setItemParkId(item.parkId);
    setItemNotes(item.notes ?? "");
    if (item.itemType === "event") {
      setItemName(item.name);
      setItemTime(item.time);
    } else {
      setBlockDuration(item.blockDuration ?? "full");
      setBlockStart(item.time);
      setBlockEnd(item.endTime ?? null);
    }
    setModalVisible(true);
  };

  const resetModal = () => {
    setEditingItem(null);
    setConflict(null);
    setItemName("");
    setItemParkId("");
    setItemNotes("");
    setItemTime(null);
    setBlockDuration("full");
    setBlockStart(null);
    setBlockEnd(null);
    setParkPickerVisible(false);
    setFabExpanded(false);
    setModalVisible(false);
  };

  const openModal = (type: "block" | "event") => {
    setModalType(type);
    setConflict(null);
    setFabExpanded(false);
    setModalVisible(true);
  };

  const getBlockTimes = (): { startMins: number; endMins: number } | null => {
    if (blockDuration === "specific") {
      if (blockStart === null || blockEnd === null) return null;
      return { startMins: blockStart, endMins: blockEnd };
    }
    return {
      startMins: blockStartTime(blockDuration),
      endMins: blockEndTime(blockDuration),
    };
  };

  const handleAdd = async () => {
    if (!itemParkId || !user || !activeTrip || !selectedDate) return;
    if (modalType === "event" && !itemName.trim()) return;

    if (modalType === "block") {
      const times = getBlockTimes();
      if (!times) return;
      const found = findConflict(
        blocks,
        times.startMins,
        times.endMins,
        editingItem?.$id
      );
      if (found) {
        setConflict(found);
        return;
      }
    }

    await saveItem();
  };

  const saveItem = async () => {
    if (!itemParkId || !user || !activeTrip || !selectedDate) return;

    if (modalType === "event") {
      if (itemTime === null) return;
      const data = {
        name: itemName.trim(),
        time: itemTime,
        parkId: itemParkId,
        notes: itemNotes.trim() || undefined,
      };
      if (editingItem) {
        await updateItem(editingItem.$id, data);
      } else {
        await addItem({
          userId: user.$id,
          tripId: activeTrip.$id,
          date: selectedDate,
          itemType: "event",
          ...data,
        });
      }
    } else {
      const times = getBlockTimes();
      if (!times) return;
      const parkName =
        PARKS.find((p) => p.id === itemParkId)?.name ?? itemParkId;
      const data = {
        name: parkName,
        time: times.startMins,
        endTime: times.endMins,
        parkId: itemParkId,
        blockDuration,
      };
      if (editingItem) {
        await updateItem(editingItem.$id, data);
      } else {
        await addItem({
          userId: user.$id,
          tripId: activeTrip.$id,
          date: selectedDate,
          itemType: "block",
          ...data,
        });
      }
    }

    resetModal();
  };

  const handleAutoAdjust = async () => {
    if (!conflict || !user || !activeTrip || !selectedDate) return;
    const times = getBlockTimes();
    if (!times) return;
    const parkName = PARKS.find((p) => p.id === itemParkId)?.name ?? itemParkId;

    await updateAndAddItem(
      conflict.block.$id,
      {
        time: conflict.adjustedStart,
        endTime: conflict.adjustedEnd,
        blockDuration: "specific",
      },
      {
        userId: user.$id,
        tripId: activeTrip.$id,
        date: selectedDate,
        name: parkName,
        time: times.startMins,
        endTime: times.endMins,
        parkId: itemParkId,
        itemType: "block",
        blockDuration,
      }
    );

    resetModal();
  };

  const handleDeleteConflictAndSave = async () => {
    if (!conflict || !user || !activeTrip || !selectedDate) return;

    if (modalType === "event") {
      await removeItem(conflict.block.$id);
      setConflict(null);
      await saveItem();
      return;
    }

    const times = getBlockTimes();
    if (!times) return;
    const parkName = PARKS.find((p) => p.id === itemParkId)?.name ?? itemParkId;

    await removeAndAddItem(conflict.block.$id, {
      userId: user.$id,
      tripId: activeTrip.$id,
      date: selectedDate,
      name: parkName,
      time: times.startMins,
      endTime: times.endMins,
      parkId: itemParkId,
      itemType: "block",
      blockDuration,
    });

    resetModal();
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!activeTrip) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: theme.background }}
      >
        <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
        <Text className="text-center mt-4" style={{ color: theme.textMuted }}>
          No upcoming trip found.{"\n"}Create a trip to start planning.
        </Text>
      </View>
    );
  }

  const conflictParkName = conflict
    ? PARKS.find((p) => p.id === conflict.block.parkId)?.name ??
      conflict.block.name
    : "";

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <View
        className="px-4 pt-14 pb-4"
        style={{ backgroundColor: theme.surface }}
      >
        <Text className="text-xl font-bold" style={{ color: theme.text }}>
          {activeTrip.name}
        </Text>
        <Text className="text-sm mt-1" style={{ color: theme.textMuted }}>
          {new Date(
            activeTrip.startDate.split("T")[0] + "T00:00:00"
          ).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          {" — "}
          {new Date(
            activeTrip.endDate.split("T")[0] + "T00:00:00"
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        style={{ backgroundColor: theme.surface, maxHeight: 72 }}
      >
        {tripDates.map((date) => {
          const { day, num } = formatDayLabel(date);
          const isSelected = date === selectedDate;
          return (
            <TouchableOpacity
              key={date}
              onPress={() => setSelectedDate(date)}
              className="items-center justify-center rounded-xl px-4 py-2 mr-2"
              style={{
                backgroundColor: isSelected ? theme.accent : theme.elevated,
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{
                  color: isSelected ? theme.background : theme.textMuted,
                }}
              >
                {day}
              </Text>
              <Text
                className="text-base font-bold"
                style={{ color: isSelected ? theme.background : theme.text }}
              >
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      <ScrollView ref={scrollRef} className="flex-1">
        {/* Expand earlier */}
        <TouchableOpacity
          onPress={() => setEarlierHours((h) => h + 2)}
          className="items-center py-2"
          style={{ backgroundColor: theme.surface }}
        >
          <Text className="text-xs" style={{ color: theme.textMuted }}>
            ↑ Earlier ({formatHourLabel(Math.max(0, timelineStart - 2))})
          </Text>
        </TouchableOpacity>

        {/* Canvas */}
        <View style={{ height: canvasHeight, position: "relative" }}>
          {/* Hour lines and labels */}
          {hours.map((hour, i) => (
            <View
              key={hour}
              style={{
                position: "absolute",
                top: i * HOUR_HEIGHT,
                left: 0,
                right: 0,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Text
                style={{
                  width: LABEL_WIDTH,
                  fontSize: 11,
                  color: theme.textMuted,
                  paddingLeft: 12,
                  paddingTop: 4,
                }}
              >
                {formatHourLabel(hour)}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: theme.border,
                  marginTop: 10,
                }}
              />
            </View>
          ))}

          {/* Park blocks */}
          {blocks.map((block, index) => {
            const park = PARKS.find((p) => p.id === block.parkId);
            const startY = minutesToY(block.time, timelineStart);
            const endMins = block.endTime ?? block.time + 60;
            const height = durationToHeight(block.time, endMins);

            const isOverlapping = blocks.some((other, otherIndex) => {
              if (otherIndex === index) return false;
              const oStart = other.time;
              const oEnd = other.endTime ?? other.time + 60;
              return Math.max(block.time, oStart) < Math.min(endMins, oEnd);
            });

            const leftOffset = isOverlapping && index % 2 !== 0 ? 24 : 0;

            return (
              <TouchableOpacity
                key={block.$id}
                onPress={() => openEditModal(block)}
                onLongPress={() => removeItem(block.$id)}
                style={{
                  position: "absolute",
                  top: startY,
                  left: LABEL_WIDTH + leftOffset,
                  right: 8,
                  height,
                  backgroundColor: park?.color ?? theme.accent,
                  borderRadius: 8,
                  padding: 8,
                  opacity: 0.85,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}
                >
                  {block.name}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {formatTime(block.time)} — {formatTime(endMins)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Events */}
          {events.map((event) => {
            const park = PARKS.find((p) => p.id === event.parkId);
            const startY = minutesToY(event.time, timelineStart);
            return (
              <TouchableOpacity
                key={event.$id}
                onPress={() => openEditModal(event)}
                onLongPress={() => removeItem(event.$id)}
                style={{
                  position: "absolute",
                  top: startY,
                  left: LABEL_WIDTH + 8,
                  right: 16,
                  backgroundColor: theme.elevated,
                  borderRadius: 6,
                  padding: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: park?.color ?? theme.accent,
                  minHeight: 28,
                }}
              >
                <Text
                  style={{ color: theme.text, fontWeight: "600", fontSize: 11 }}
                >
                  {event.name}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 10 }}>
                  {formatTime(event.time)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Overlap indicators */}
          {getOverlapRegions(blocks, timelineStart).map((region, i) => (
            <Svg
              key={i}
              style={{
                position: "absolute",
                top: region.top,
                left: LABEL_WIDTH,
                right: 8,
              }}
              width="100%"
              height={region.height}
            >
              <Defs>
                <Pattern
                  id={`stripe-${i}`}
                  patternUnits="userSpaceOnUse"
                  width="8"
                  height="8"
                  patternTransform="rotate(45)"
                >
                  <Line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="8"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="3"
                  />
                </Pattern>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height={region.height}
                fill={`url(#stripe-${i})`}
                rx="8"
              />
            </Svg>
          ))}
        </View>

        {/* Expand later */}
        <TouchableOpacity
          onPress={() => setLaterHours((h) => h + 2)}
          className="items-center py-2"
          style={{ backgroundColor: theme.surface }}
        >
          <Text className="text-xs" style={{ color: theme.textMuted }}>
            ↓ Later ({formatHourLabel(Math.min(23, timelineEnd + 2))})
          </Text>
        </TouchableOpacity>

        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <View
        style={{
          position: "absolute",
          bottom: 32,
          right: 24,
          alignItems: "flex-end",
        }}
      >
        {fabExpanded && (
          <View style={{ marginBottom: 12, alignItems: "flex-end", gap: 8 }}>
            <TouchableOpacity
              onPress={() => openModal("block")}
              className="flex-row items-center rounded-full px-4 py-2"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.accent}
              />
              <Text
                className="ml-2 text-sm font-medium"
                style={{ color: theme.text }}
              >
                Add Block
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openModal("event")}
              className="flex-row items-center rounded-full px-4 py-2"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Ionicons name="time-outline" size={16} color={theme.accent} />
              <Text
                className="ml-2 text-sm font-medium"
                style={{ color: theme.text }}
              >
                Add Event
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          onPress={() => setFabExpanded((e) => !e)}
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.accent }}
        >
          <Ionicons
            name={fabExpanded ? "close" : "add"}
            size={28}
            color={theme.background}
          />
        </TouchableOpacity>
      </View>

      {/* Add/Edit modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl px-6 pt-6 pb-10"
            style={{ backgroundColor: theme.surface }}
          >
            <Text
              className="text-lg font-bold mb-6"
              style={{ color: theme.text }}
            >
              {editingItem
                ? modalType === "block"
                  ? "Edit Park Block"
                  : "Edit Event"
                : modalType === "block"
                ? "Add Park Block"
                : "Add Event"}
            </Text>

            {/* Conflict warning */}
            {conflict && (
              <View
                className="rounded-xl p-4 mb-4"
                style={{
                  backgroundColor: "#EF444420",
                  borderWidth: 1,
                  borderColor: "#EF4444",
                }}
              >
                <Text
                  className="text-sm font-semibold mb-1"
                  style={{ color: "#EF4444" }}
                >
                  Scheduling conflict
                </Text>
                <Text
                  className="text-xs mb-3"
                  style={{ color: theme.textSecondary }}
                >
                  This overlaps significantly with {conflictParkName}. You can't
                  be in two places at once!
                </Text>
                {conflict.canAdjust && (
                  <TouchableOpacity
                    onPress={handleAutoAdjust}
                    className="rounded-lg py-2 items-center mb-2"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: theme.background }}
                    >
                      Adjust {conflictParkName} to fit (
                      {formatTime(conflict.adjustedStart)} —{" "}
                      {formatTime(conflict.adjustedEnd)})
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleDeleteConflictAndSave}
                  className="rounded-lg py-2 items-center"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <Text className="text-xs font-bold" style={{ color: "#fff" }}>
                    Remove {conflictParkName} and save
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Name — events only */}
            {modalType === "event" && (
              <>
                <Text
                  className="text-xs mb-1"
                  style={{ color: theme.textMuted }}
                >
                  NAME
                </Text>
                <TextInput
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g. Lunch at Be Our Guest"
                  placeholderTextColor={theme.textMuted}
                  className="rounded-xl px-4 py-3 mb-4 text-sm"
                  style={{ backgroundColor: theme.elevated, color: theme.text }}
                />
              </>
            )}

            {/* Park picker */}
            <Text className="text-xs mb-1" style={{ color: theme.textMuted }}>
              PARK
            </Text>
            <TouchableOpacity
              onPress={() => setParkPickerVisible(!parkPickerVisible)}
              className="rounded-xl px-4 py-3 mb-1 flex-row justify-between items-center"
              style={{ backgroundColor: theme.elevated }}
            >
              <Text
                className="text-sm"
                style={{ color: selectedPark ? theme.text : theme.textMuted }}
              >
                {selectedPark ? selectedPark.name : "Select a park…"}
              </Text>
              <Ionicons
                name={parkPickerVisible ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {parkPickerVisible && (
              <View
                className="rounded-xl mb-4 overflow-hidden"
                style={{ backgroundColor: theme.elevated, maxHeight: 180 }}
              >
                <ScrollView nestedScrollEnabled>
                  {(() => {
                    const tripParks = PARKS.filter((p) =>
                      activeTrip!.parks.includes(p.id)
                    );
                    const onSchedule = tripParks.filter((p) =>
                      blocks.some((b) => b.parkId === p.id)
                    );
                    const offSchedule = tripParks.filter(
                      (p) => !blocks.some((b) => b.parkId === p.id)
                    );
                    const sorted =
                      modalType === "event"
                        ? [...onSchedule, ...offSchedule]
                        : tripParks;

                    return sorted.map((park) => {
                      const hasBlock =
                        modalType === "event" &&
                        blocks.some((b) => b.parkId === park.id);
                      return (
                        <TouchableOpacity
                          key={park.id}
                          onPress={() => {
                            setItemParkId(park.id);
                            setParkPickerVisible(false);
                          }}
                          className="flex-row items-center px-4 py-3 border-b"
                          style={{
                            borderColor: theme.border,
                            backgroundColor: hasBlock
                              ? `${park.color}22`
                              : "transparent",
                          }}
                        >
                          <View
                            className="w-2 h-2 rounded-full mr-3"
                            style={{ backgroundColor: park.color }}
                          />
                          <View className="flex-1">
                            <Text
                              className="text-sm font-medium"
                              style={{ color: theme.text }}
                            >
                              {park.name}
                            </Text>
                            <Text
                              className="text-xs"
                              style={{ color: theme.textMuted }}
                            >
                              {park.resort}
                            </Text>
                          </View>
                          {hasBlock && (
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: park.color }}
                            >
                              On schedule
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>
              </View>
            )}

            {/* Block duration */}
            {modalType === "block" && (
              <>
                <Text
                  className="text-xs mb-2 mt-3"
                  style={{ color: theme.textMuted }}
                >
                  DURATION
                </Text>
                <View className="flex-row gap-2 mb-4">
                  {(["full", "am", "pm", "specific"] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setBlockDuration(opt);
                        setConflict(null);
                      }}
                      className="flex-1 items-center py-2 rounded-xl"
                      style={{
                        backgroundColor:
                          blockDuration === opt ? theme.accent : theme.elevated,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color:
                            blockDuration === opt
                              ? theme.background
                              : theme.text,
                        }}
                      >
                        {opt === "full"
                          ? "Full Day"
                          : opt === "am"
                          ? "AM"
                          : opt === "pm"
                          ? "PM"
                          : "Custom"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {blockDuration === "specific" && (
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text
                        className="text-xs mb-1"
                        style={{ color: theme.textMuted }}
                      >
                        START
                      </Text>
                      <TouchableOpacity
                        onPress={() => setBlockStartPickerVisible(true)}
                        className="rounded-xl px-4 py-3 items-center"
                        style={{ backgroundColor: theme.elevated }}
                      >
                        <Text
                          className="text-sm"
                          style={{
                            color:
                              blockStart !== null
                                ? theme.text
                                : theme.textMuted,
                          }}
                        >
                          {blockStart !== null
                            ? formatTime(blockStart)
                            : "Start…"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-xs mb-1"
                        style={{ color: theme.textMuted }}
                      >
                        END
                      </Text>
                      <TouchableOpacity
                        onPress={() => setBlockEndPickerVisible(true)}
                        className="rounded-xl px-4 py-3 items-center"
                        style={{ backgroundColor: theme.elevated }}
                      >
                        <Text
                          className="text-sm"
                          style={{
                            color:
                              blockEnd !== null ? theme.text : theme.textMuted,
                          }}
                        >
                          {blockEnd !== null ? formatTime(blockEnd) : "End…"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <DateTimePickerModal
                  isVisible={blockStartPickerVisible}
                  mode="time"
                  date={(() => {
                    const d = new Date();
                    const mins = blockStart !== null ? blockStart : 540;
                    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
                    return d;
                  })()}
                  onConfirm={(date) => {
                    setBlockStart(date.getHours() * 60 + date.getMinutes());
                    setBlockStartPickerVisible(false);
                    setConflict(null);
                  }}
                  onCancel={() => setBlockStartPickerVisible(false)}
                />
                <DateTimePickerModal
                  isVisible={blockEndPickerVisible}
                  mode="time"
                  date={(() => {
                    const d = new Date();
                    const mins = blockEnd !== null ? blockEnd : 540;
                    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
                    return d;
                  })()}
                  onConfirm={(date) => {
                    setBlockEnd(date.getHours() * 60 + date.getMinutes());
                    setBlockEndPickerVisible(false);
                    setConflict(null);
                  }}
                  onCancel={() => setBlockEndPickerVisible(false)}
                />
              </>
            )}

            {/* Event time — events only */}
            {modalType === "event" && (
              <>
                <Text
                  className="text-xs mb-1 mt-3"
                  style={{ color: theme.textMuted }}
                >
                  TIME
                </Text>
                <TouchableOpacity
                  onPress={() => setTimePickerVisible(true)}
                  className="rounded-xl px-4 py-3 mb-4 flex-row justify-between items-center"
                  style={{ backgroundColor: theme.elevated }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: itemTime !== null ? theme.text : theme.textMuted,
                    }}
                  >
                    {itemTime !== null
                      ? formatTime(itemTime)
                      : "Select a time…"}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={timePickerVisible}
                  mode="time"
                  date={(() => {
                    const d = new Date();
                    const mins = itemTime !== null ? itemTime : 540;
                    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
                    return d;
                  })()}
                  onConfirm={(date) => {
                    setItemTime(date.getHours() * 60 + date.getMinutes());
                    setTimePickerVisible(false);
                  }}
                  onCancel={() => setTimePickerVisible(false)}
                />
              </>
            )}

            {/* Notes — events only */}
            {modalType === "event" && (
              <>
                <Text
                  className="text-xs mb-1 mt-2"
                  style={{ color: theme.textMuted }}
                >
                  NOTES (optional)
                </Text>
                <TextInput
                  value={itemNotes}
                  onChangeText={setItemNotes}
                  placeholder="Any extra details…"
                  placeholderTextColor={theme.textMuted}
                  className="rounded-xl px-4 py-3 mb-6 text-sm"
                  style={{ backgroundColor: theme.elevated, color: theme.text }}
                />
              </>
            )}

            <TouchableOpacity
              onPress={handleAdd}
              className="rounded-xl py-4 items-center mt-4"
              style={{ backgroundColor: theme.accent }}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: theme.background }}
              >
                {editingItem
                  ? modalType === "block"
                    ? "Save Block"
                    : "Save Event"
                  : modalType === "block"
                  ? "Add Block"
                  : "Add Event"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetModal}
              className="mt-4 items-center"
            >
              <Text className="text-sm" style={{ color: theme.textMuted }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
