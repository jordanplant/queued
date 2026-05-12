import { PARKS } from '@/constants/parks'
import { Trip, getTrip, updateTrip } from '@/services/trips'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function TripDetail() {
  const { id, edit, from } = useLocalSearchParams<{ id: string, edit?: string, from?: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStartDate, setEditStartDate] = useState<Date | null>(null)
  const [editEndDate, setEditEndDate] = useState<Date | null>(null)
  const [editParks, setEditParks] = useState<string[]>([])
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const editOpenedRef = useRef(false)

  useEffect(() => {
    getTrip(id)
      .then(setTrip)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (edit === 'true' && trip && !editOpenedRef.current) {
      editOpenedRef.current = true
      openEdit()
    }
  }, [edit, trip])

  const openEdit = () => {
    if (!trip) return
    setEditName(trip.name)
    setEditStartDate(new Date(trip.startDate))
    setEditEndDate(new Date(trip.endDate))
    setEditParks(trip.parks)
    setEditVisible(true)
  }

  const handleSave = async () => {
    if (!editName || !editStartDate || !editEndDate) return
    setSaving(true)
    try {
      const updated = await updateTrip(id, {
        name: editName,
        startDate: editStartDate.toISOString(),
        endDate: editEndDate.toISOString(),
        parks: editParks,
      })
      setTrip(updated as unknown as Trip)
      setEditVisible(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const togglePark = (parkId: string) => {
    setEditParks(prev =>
      prev.includes(parkId)
        ? prev.filter(p => p !== parkId)
        : [...prev, parkId]
    )
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const goBack = () => {
    if (from === 'profile') {
      router.push('/(tabs)/profile')
    } else {
      router.push('/')
    }
  }

  const BackButton = () => (
    <TouchableOpacity
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      onPress={goBack}
    >
      <Text className="text-[#00E5FF] text-sm">← Back</Text>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View className="flex-1 bg-[#0D0F14] items-center justify-center">
        <ActivityIndicator color="#00E5FF" />
      </View>
    )
  }

  if (!trip) {
    return (
      <View className="flex-1 bg-[#0D0F14] px-6 pt-16">
        <BackButton />
        <Text className="text-white text-lg mt-6">Trip not found.</Text>
      </View>
    )
  }

  const tripParks = PARKS.filter(p => trip.parks.includes(p.id))
  const tripResorts = [...new Set(tripParks.map(p => p.resort))]

  const formatList = (items: string[]) => {
    if (items.length === 1) return items[0]
    if (items.length === 2) return `${items[0]} & ${items[1]}`
    return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
  }

  const resorts = PARKS.reduce((acc, park) => {
    if (!acc[park.resort]) acc[park.resort] = []
    acc[park.resort].push(park)
    return acc
  }, {} as Record<string, typeof PARKS[number][]>)

  return (
    <>
      <ScrollView className="flex-1 bg-[#0D0F14]">
        <View className="px-6 pt-16 pb-8">

          {/* Back + Edit row */}
          <View className="flex-row justify-between items-center mb-6">
            <BackButton />
            <TouchableOpacity onPress={openEdit}>
              <Text className="text-[#00E5FF] text-sm">✎ Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Trip name */}
          <Text className="text-white text-2xl font-bold">{trip.name}</Text>

          {/* Resort names */}
          <Text className="text-[#9BA3B8] text-base font-medium mb-1">
            {formatList(tripResorts)}
          </Text>

          {/* Park chips */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {tripParks.map(park => (
              <View
                key={park.id}
                style={{ backgroundColor: park.color }}
                className="px-3 py-1 rounded-full"
              >
                <Text className="text-white text-xs font-semibold">{park.name}</Text>
              </View>
            ))}
          </View>

          {/* Dates */}
          <View className="bg-[#1C2030] rounded-xl p-4 mt-6">
            <Text className="text-[#9BA3B8] text-xs mb-1">Dates</Text>
            <Text className="text-white font-semibold">
              {trip.startDate.split('T')[0]} → {trip.endDate.split('T')[0]}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <ScrollView className="flex-1 bg-[#0D0F14]">
          <View className="px-6 pt-12 pb-8">

            {/* Modal header */}
            <View className="flex-row justify-between items-center mb-8">
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text className="text-[#9BA3B8]">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-white font-bold text-base">Edit Trip</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#00E5FF" />
                  : <Text className="text-[#00E5FF] font-semibold">Save</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">Trip Name</Text>
            <TextInput
              className="bg-[#1C2030] text-white rounded-xl px-4 py-4 mb-6"
              placeholderTextColor="#9BA3B8"
              value={editName}
              onChangeText={setEditName}
            />

            {/* Start date */}
            <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">Start Date</Text>
            <TouchableOpacity
              className="bg-[#1C2030] rounded-xl px-4 py-4 mb-2"
              onPress={() => setShowStartPicker(true)}
            >
              <Text className={editStartDate ? 'text-white' : 'text-[#9BA3B8]'}>
                {editStartDate ? formatDate(editStartDate) : 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <View className="bg-[#1C2030] rounded-xl mb-6">
                <TouchableOpacity
                  className="items-end px-4 pt-3"
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text className="text-[#00E5FF] font-semibold">Done</Text>
                </TouchableOpacity>
                <DateTimePicker
                  value={editStartDate ?? new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    if (date) setEditStartDate(date)
                  }}
                />
              </View>
            )}

            {/* End date */}
            <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">End Date</Text>
            <TouchableOpacity
              className="bg-[#1C2030] rounded-xl px-4 py-4 mb-2"
              onPress={() => setShowEndPicker(true)}
            >
              <Text className={editEndDate ? 'text-white' : 'text-[#9BA3B8]'}>
                {editEndDate ? formatDate(editEndDate) : 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <View className="bg-[#1C2030] rounded-xl mb-6">
                <TouchableOpacity
                  className="items-end px-4 pt-3"
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text className="text-[#00E5FF] font-semibold">Done</Text>
                </TouchableOpacity>
                <DateTimePicker
                  value={editEndDate ?? editStartDate ?? new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={editStartDate ?? new Date()}
                  onChange={(event, date) => {
                    if (date) setEditEndDate(date)
                  }}
                />
              </View>
            )}

            {/* Parks */}
            <Text className="text-[#9BA3B8] text-xs mb-4 uppercase tracking-wider">Parks</Text>
            {Object.entries(resorts).map(([resort, parks]) => (
              <View key={resort} className="mb-6">
                <Text className="text-[#9BA3B8] text-xs mb-3">{resort}</Text>
                {parks.map(park => (
                  <TouchableOpacity
                    key={park.id}
                    className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 ${
                      editParks.includes(park.id) ? 'bg-[#252840]' : 'bg-[#1C2030]'
                    }`}
                    onPress={() => togglePark(park.id)}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{ backgroundColor: park.color }}
                        className="w-3 h-3 rounded-full"
                      />
                      <Text className="text-white text-sm">{park.name}</Text>
                    </View>
                    {editParks.includes(park.id) && (
                      <Text style={{ color: park.color }} className="text-sm font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}

          </View>
        </ScrollView>
      </Modal>
    </>
  )
}