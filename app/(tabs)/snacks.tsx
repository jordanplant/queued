import SwipeableRow from "@/components/SwipeableRow";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useSnacks } from "@/hooks/useSnacks";
import { Snack } from "@/services/snacks";

import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type MenuItem = {
  itemTitle: string;
  itemPrice: number;
  restaurantName: string;
  restaurantLocation: string;
  subLocation: string;
  itemDescription: string;
};

const MENU_URL = "https://jordanplant.github.io/Data/menu.json";

export default function Snacks() {
  const { user, currentTrip } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const {
    snacks,
    loading,
    addSnack,
    markEaten,
    unmarkEaten,
    removeSnack,
    rateSnack,
    updateSnackDetails,
  } = useSnacks();

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedParks, setSelectedParks] = useState<string[]>([]);
  const [availableParks, setAvailableParks] = useState<string[]>([]);
  const [tripParkNames, setTripParkNames] = useState<string[]>([]);

  // Add / Edit modal
  const [snackModalVisible, setSnackModalVisible] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalRestaurant, setModalRestaurant] = useState("");
  const [modalLocation, setModalLocation] = useState("");

  // Rating
  const [ratingSnackId, setRatingSnackId] = useState<string | null>(null);
  const [pendingRating, setPendingRating] = useState(0);

  // Load menu data once
  useEffect(() => {
    fetch(MENU_URL)
      .then((r) => r.json())
      .then(setMenuData)
      .catch(console.error);
  }, []);

  // Load trip parks for filter suggestions
  useEffect(() => {
    if (!currentTrip?.parks?.length) return;
    setTripParkNames(currentTrip.parks);
  }, [currentTrip]);
  // Build available parks from snack list
  useEffect(() => {
    const parks = [
      ...new Set(
        snacks.map((s) => s.restaurantLocation).filter((p): p is string => !!p),
      ),
    ].sort();
    setAvailableParks(parks);
  }, [snacks]);

  // Search logic
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(() => {
      const filtered = menuData.filter((item) =>
        item.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setSearchResults(filtered);
      setDropdownOpen(true);
      setSearchLoading(false);
    }, 200);
  }, [searchTerm, menuData]);

  // ── Modal helpers ──────────────────────────────────────────
  const openAddModal = (prefillTitle = "") => {
    setEditingSnack(null);
    setModalTitle(prefillTitle);
    setModalPrice("");
    setModalRestaurant("");
    setModalLocation("");
    setSnackModalVisible(true);
  };

  const openEditModal = (snack: Snack) => {
    setEditingSnack(snack);
    setModalTitle(snack.itemTitle);
    setModalPrice(snack.itemPrice?.toString() ?? "");
    setModalRestaurant(snack.restaurantName ?? "");
    setModalLocation(snack.restaurantLocation ?? "");
    setSnackModalVisible(true);
  };

  const closeSnackModal = () => {
    setSnackModalVisible(false);
    setEditingSnack(null);
  };

  const onModalSubmit = async () => {
    if (!modalTitle.trim()) return;
    if (editingSnack) {
      await updateSnackDetails(editingSnack.$id, {
        itemTitle: modalTitle.trim(),
        itemPrice: modalPrice ? parseFloat(modalPrice) : null,
        restaurantName: modalRestaurant.trim() || null,
        restaurantLocation: modalLocation.trim() || null,
      });
    } else {
      await addSnack({
        itemTitle: modalTitle.trim(),
        itemPrice: modalPrice ? parseFloat(modalPrice) : null,
        restaurantName: modalRestaurant.trim() || null,
        restaurantLocation: modalLocation.trim() || null,
        subLocation: null,
        itemDescription: null,
      });
    }
    closeSnackModal();
  };

  // ── Search actions ─────────────────────────────────────────
  const onSelectItem = (item: MenuItem) => {
    addSnack({
      itemTitle: item.itemTitle,
      itemPrice: item.itemPrice,
      restaurantName: item.restaurantName,
      restaurantLocation: item.restaurantLocation,
      subLocation: item.subLocation,
      itemDescription: item.itemDescription,
    });
    setSearchTerm("");
    setDropdownOpen(false);
  };

  // ── Rating ─────────────────────────────────────────────────
  const onMarkEaten = (id: string) => {
    setRatingSnackId(id);
    setPendingRating(0);
  };

  const onSubmitRating = () => {
    if (!ratingSnackId) return;
    markEaten(ratingSnackId, pendingRating > 0 ? pendingRating : null);
    setRatingSnackId(null);
    setPendingRating(0);
  };

  const onSkipRating = () => {
    if (!ratingSnackId) return;
    markEaten(ratingSnackId, null);
    setRatingSnackId(null);
    setPendingRating(0);
  };

  const onCancelRating = () => {
    setRatingSnackId(null);
    setPendingRating(0);
  };

  // ── Derived data ───────────────────────────────────────────
  const filteredSnacks =
    selectedParks.length > 0
      ? snacks.filter(
          (s) =>
            s.restaurantLocation &&
            selectedParks.includes(s.restaurantLocation),
        )
      : snacks;

  const sortedSnacks = [
    ...filteredSnacks.filter((s) => !s.completed),
    ...filteredSnacks.filter((s) => s.completed),
  ];

  // ── Render helpers ─────────────────────────────────────────
  const StarRating = () => (
    <View
      className="rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
      style={{ backgroundColor: theme.elevated }}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
        <View>
          <Text className="text-text text-xs font-medium mb-1">
            Rate this snack:
          </Text>
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setPendingRating(star)}
              >
                <Ionicons
                  name={star <= pendingRating ? "star" : "star-outline"}
                  size={22}
                  color={star <= pendingRating ? "#FFD700" : theme.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View className="items-center gap-1">
        <TouchableOpacity
          onPress={onSubmitRating}
          className="px-3 py-1 rounded-full border"
          style={{ borderColor: theme.accent }}
        >
          <Text
            style={{ color: theme.accent }}
            className="text-xs font-semibold"
          >
            Submit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkipRating}>
          <Text className="text-textMuted text-xs">Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancelRating}>
          <Text className="text-textMuted text-xs">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSnack = ({ item }: { item: Snack }) => {
    if (ratingSnackId === item.$id) return <StarRating />;

    return (
      <SwipeableRow
        marginBottom={8}
        actions={[
          {
            icon: "create-outline",
            color: `${theme.accent}20`,
            textColor: theme.accent,
            onPress: () => openEditModal(item),
          },
          {
            icon: "trash-outline",
            color: "#FF4D4D20",
            textColor: "#FF4D4D",
            onPress: () => removeSnack(item.$id),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            item.completed ? unmarkEaten(item.$id) : onMarkEaten(item.$id)
          }
          className="rounded-xl px-4 py-3 mb-2 flex-row items-center gap-3"
          style={{ backgroundColor: theme.surface }}
        >
          <Ionicons
            name={item.completed ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={item.completed ? theme.accent : theme.textMuted}
          />

          <View className="flex-1">
            <Text
              className="text-text text-sm font-medium"
              style={{ opacity: item.completed ? 0.5 : 1 }}
              numberOfLines={1}
            >
              {item.itemTitle}
            </Text>
            <Text
              className="text-textSecondary text-xs"
              style={{ opacity: item.completed ? 0.5 : 1 }}
              numberOfLines={1}
            >
              {[
                item.itemPrice ? `$${item.itemPrice.toFixed(2)}` : null,
                item.restaurantName,
                item.restaurantLocation,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          {item.completed && item.rating ? (
            <View className="flex-row gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= item.rating! ? "star" : "star-outline"}
                  size={12}
                  color={star <= item.rating! ? "#FFD700" : theme.textMuted}
                />
              ))}
            </View>
          ) : item.completed && !item.rating ? (
            <TouchableOpacity
              onPress={() => {
                setRatingSnackId(item.$id);
                setPendingRating(0);
              }}
            >
              <Text style={{ color: theme.accent }} className="text-xs">
                Rate
              </Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-text text-2xl font-bold">Snacks</Text>
          <TouchableOpacity
            onPress={() => openAddModal()}
            className="bg-surface rounded-full w-9 h-9 items-center justify-center"
          >
            <Ionicons name="add" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 mb-2">
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
            className="flex-1 text-text text-sm"
            placeholder="Search snacks..."
            placeholderTextColor={theme.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <View className="flex-row items-center gap-2">
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm("");
                  setDropdownOpen(false);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <Ionicons
                name="options-outline"
                size={18}
                color={
                  selectedParks.length > 0 ? theme.accent : theme.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search dropdown */}
        {dropdownOpen && (
          <View
            className="rounded-xl overflow-hidden mb-2"
            style={{ backgroundColor: theme.elevated, maxHeight: 280 }}
          >
            {searchLoading ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => onSelectItem(item)}
                      className="px-4 py-3 border-b border-border"
                    >
                      <Text className="text-text text-sm" numberOfLines={1}>
                        {item.itemTitle}
                      </Text>
                      <Text className="text-textSecondary text-xs">
                        {item.restaurantName} · {item.restaurantLocation}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setDropdownOpen(false);
                      openAddModal(searchTerm);
                      setSearchTerm("");
                    }}
                    className="px-4 py-3 flex-row items-center gap-2"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={theme.accent}
                    />
                    <Text style={{ color: theme.accent }} className="text-sm">
                      Add "{searchTerm}" manually
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Active filter pill */}
        {selectedParks.length > 0 && (
          <TouchableOpacity
            onPress={() => setSelectedParks([])}
            className="flex-row items-center gap-1 self-start bg-surface rounded-full px-3 py-1 mt-2"
          >
            <Text style={{ color: theme.accent }} className="text-xs">
              {selectedParks.length === 1
                ? selectedParks[0]
                : `${selectedParks.length} parks`}
            </Text>
            <Ionicons name="close" size={12} color={theme.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={sortedSnacks}
          keyExtractor={(item) => item.$id}
          renderItem={renderSnack}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            sortedSnacks.length > 0 ? (
              <Text className="text-textMuted text-xs mb-3">
                {filteredSnacks.filter((s) => !s.completed).length} to try ·{" "}
                {filteredSnacks.filter((s) => s.completed).length} eaten
                {selectedParks.length > 0
                  ? ` · ${selectedParks.length === 1 ? selectedParks[0] : `${selectedParks.length} parks`}`
                  : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-16">
              <Ionicons
                name="fast-food-outline"
                size={40}
                color={theme.textMuted}
              />
              <Text className="text-textMuted text-sm mt-4 text-center">
                {selectedParks.length > 0
                  ? `No snacks saved for ${selectedParks.join(", ")}`
                  : "Search above to start building your snack list"}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={snackModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSnackModal}
      >
        <View className="flex-1 bg-background px-6 pt-12 pb-8">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-text font-bold text-base">
              {editingSnack ? "Edit Snack" : "Add Snack"}
            </Text>
            <TouchableOpacity onPress={closeSnackModal}>
              <Text className="text-textSecondary">Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-textSecondary text-xs mb-2 uppercase tracking-wider">
            Name
          </Text>
          <TextInput
            className="bg-surface text-text rounded-xl px-4 py-4 mb-6"
            placeholder="e.g. Dole Whip"
            placeholderTextColor={theme.textMuted}
            value={modalTitle}
            onChangeText={setModalTitle}
          />

          <Text className="text-textSecondary text-xs mb-2 uppercase tracking-wider">
            Price
          </Text>
          <TextInput
            className="bg-surface text-text rounded-xl px-4 py-4 mb-6"
            placeholder="e.g. 5.99"
            placeholderTextColor={theme.textMuted}
            value={modalPrice}
            onChangeText={setModalPrice}
            keyboardType="decimal-pad"
          />

          <Text className="text-textSecondary text-xs mb-2 uppercase tracking-wider">
            Restaurant
          </Text>
          <TextInput
            className="bg-surface text-text rounded-xl px-4 py-4 mb-6"
            placeholder="e.g. Aloha Isle"
            placeholderTextColor={theme.textMuted}
            value={modalRestaurant}
            onChangeText={setModalRestaurant}
          />

          <Text className="text-textSecondary text-xs mb-2 uppercase tracking-wider">
            Park
          </Text>
          <TextInput
            className="bg-surface text-text rounded-xl px-4 py-4 mb-8"
            placeholder="e.g. Magic Kingdom"
            placeholderTextColor={theme.textMuted}
            value={modalLocation}
            onChangeText={setModalLocation}
          />

          <TouchableOpacity
            onPress={onModalSubmit}
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: theme.accent }}
          >
            <Text
              style={{ color: theme.background }}
              className="font-bold text-base"
            >
              {editingSnack ? "Update" : "Add Snack"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <ScrollView className="flex-1 bg-background">
          <View className="px-6 pt-12 pb-8">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-text font-bold text-base">
                Filter by Park
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text className="text-textSecondary">Close</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedParks([])}
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2"
              style={{
                backgroundColor:
                  selectedParks.length === 0 ? theme.elevated : theme.surface,
              }}
            >
              <Text className="text-text text-sm">All Parks</Text>
              {selectedParks.length === 0 && (
                <Ionicons name="checkmark" size={16} color={theme.accent} />
              )}
            </TouchableOpacity>

            {tripParkNames.length > 0 && (
              <>
                <Text className="text-textMuted text-xs mt-4 mb-2">
                  Your Next Trip
                </Text>
                {tripParkNames.map((park) => (
                  <TouchableOpacity
                    key={park}
                    onPress={() =>
                      setSelectedParks((prev) =>
                        prev.includes(park)
                          ? prev.filter((p) => p !== park)
                          : [...prev, park],
                      )
                    }
                    className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2"
                    style={{
                      backgroundColor: selectedParks.includes(park)
                        ? theme.elevated
                        : theme.surface,
                    }}
                  >
                    <Text className="text-text text-sm">{park}</Text>
                    {selectedParks.includes(park) && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme.accent}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {availableParks.length > 0 && (
              <>
                <Text className="text-textMuted text-xs mt-4 mb-2">
                  In Your List
                </Text>
                {availableParks.map((park) => (
                  <TouchableOpacity
                    key={park}
                    onPress={() =>
                      setSelectedParks((prev) =>
                        prev.includes(park)
                          ? prev.filter((p) => p !== park)
                          : [...prev, park],
                      )
                    }
                    className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2"
                    style={{
                      backgroundColor: selectedParks.includes(park)
                        ? theme.elevated
                        : theme.surface,
                    }}
                  >
                    <Text className="text-text text-sm">{park}</Text>
                    {selectedParks.includes(park) && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme.accent}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
