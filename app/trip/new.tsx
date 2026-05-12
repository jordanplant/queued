import { PARKS } from '@/constants/parks'
import { useAuth } from '@/context/AuthContext'
import { createTrip } from '@/services/trips'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function NewTrip() {
  const { user } = useAuth()
  const { from } = useLocalSearchParams<{ from?: string }>()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [selectedParks, setSelectedParks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const goBack = () => {
    if (from === 'profile') {
      router.replace('/(tabs)/profile')
    } else {
      router.replace('/')
    }
  }

  const togglePark = (parkId: string) => {
    setSelectedParks(prev =>
      prev.includes(parkId)
        ? prev.filter(p => p !== parkId)
        : [...prev, parkId]
    )
  }

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) {
      setError('Please fill in all fields')
      return
    }
    if (!user) return

    setLoading(true)
    setError('')

    try {
      await createTrip({
        name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        parks: selectedParks,
        status: 'upcoming',
        userId: user.$id,
      })
      goBack()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const resorts = PARKS.reduce((acc, park) => {
    if (!acc[park.resort]) acc[park.resort] = []
    acc[park.resort].push(park)
    return acc
  }, {} as Record<string, typeof PARKS[number][]>)

  return (
    <ScrollView className="flex-1 bg-[#0D0F14]">
      <View className="px-6 pt-16 pb-8">

        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={goBack}
          className="mb-6"
        >
          <Text className="text-[#00E5FF] text-sm">← Back</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold mb-2">New Trip</Text>
        <Text className="text-[#9BA3B8] text-sm mb-8">Plan your next adventure</Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">Trip Name</Text>
        <TextInput
          className="bg-[#1C2030] text-white rounded-xl px-4 py-4 mb-6"
          placeholder="e.g. Florida 2026"
          placeholderTextColor="#9BA3B8"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">Start Date</Text>
        <TouchableOpacity
          className="bg-[#1C2030] rounded-xl px-4 py-4 mb-2"
          onPress={() => setShowStartPicker(true)}
        >
          <Text className={startDate ? 'text-white' : 'text-[#9BA3B8]'}>
            {startDate ? formatDate(startDate) : 'YYYY-MM-DD'}
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
              value={startDate ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(event, date) => {
                if (date) setStartDate(date)
              }}
            />
          </View>
        )}

        <Text className="text-[#9BA3B8] text-xs mb-2 uppercase tracking-wider">End Date</Text>
        <TouchableOpacity
          className="bg-[#1C2030] rounded-xl px-4 py-4 mb-2"
          onPress={() => setShowEndPicker(true)}
        >
          <Text className={endDate ? 'text-white' : 'text-[#9BA3B8]'}>
            {endDate ? formatDate(endDate) : 'YYYY-MM-DD'}
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
              value={endDate ?? startDate ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={startDate ?? new Date()}
              onChange={(event, date) => {
                if (date) setEndDate(date)
              }}
            />
          </View>
        )}

        <Text className="text-[#9BA3B8] text-xs mb-4 uppercase tracking-wider">Parks</Text>

        {Object.entries(resorts).map(([resort, parks]) => (
          <View key={resort} className="mb-6">
            <Text className="text-[#9BA3B8] text-xs mb-3">{resort}</Text>
            {parks.map(park => (
              <TouchableOpacity
                key={park.id}
                className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 ${
                  selectedParks.includes(park.id) ? 'bg-[#252840]' : 'bg-[#1C2030]'
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
                {selectedParks.includes(park.id) && (
                  <Text style={{ color: park.color }} className="text-sm font-bold">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          className="bg-[#00E5FF] rounded-xl py-4 items-center mt-4"
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0D0F14" />
            : <Text className="text-[#0D0F14] font-bold text-base">Create Trip</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}