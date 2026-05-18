import Colors from '@/constants/Colors'
import { PARKS } from '@/constants/parks'
import { useAuth } from '@/context/AuthContext'
import { Trip, getTrips } from '@/services/trips'
import { router } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function Today() {
  const { user } = useAuth()
  const [nextTrip, setNextTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  const { colorScheme } = useColorScheme()
const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

  useEffect(() => {
    if (!user) return
    getTrips(user.$id)
      .then(trips => {
        const now = new Date()
        const upcoming = trips
          .filter(t => new Date(t.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        setNextTrip(upcoming[0] ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  if (!nextTrip) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-text text-2xl font-bold mb-2">Queued</Text>
        <Text className="text-textSecondary text-sm mb-8">Your park day, sorted.</Text>
        <TouchableOpacity
          className="bg-accent px-6 py-3 rounded-xl"
          onPress={() => router.push('/trip/new')}
        >
          <Text className="text-background font-bold">Plan a trip</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const tripParks = PARKS.filter(p => nextTrip.parks.includes(p.id))
  const tripResorts = [...new Set(tripParks.map(p => p.resort))]

  const formatList = (items: string[]) => {
    if (items.length === 1) return items[0]
    if (items.length === 2) return `${items[0]} & ${items[1]}`
    return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(nextTrip.startDate)
  start.setHours(0, 0, 0, 0)
  const daysToGo = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8 gap-3">

        {/* Trip header card */}
        <View className="bg-surface rounded-2xl p-5">
          <Text className="text-accent text-xs uppercase tracking-widest mb-2">Next trip</Text>
          <Text className="text-text text-3xl font-bold mb-1">{nextTrip.name}</Text>
          <Text className="text-textSecondary text-xl font-medium mb-3">{formatList(tripResorts)}</Text>
          <View className="flex-row flex-wrap gap-2">
            {tripParks.map(park => (
              <View
                key={park.id}
                style={{ backgroundColor: park.color }}
                className="px-3 py-1 rounded-full"
              >
                <Text className="text-text text-xs font-semibold">{park.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Countdown */}
        <View className="bg-surface rounded-2xl p-8 items-center">
          <Text className="text-textSecondary text-lg tracking-widest mb-2">Days to go</Text>
          <Text className="text-text font-bold" style={{ fontSize: 96, lineHeight: 96 }}>
            {daysToGo}
          </Text>
          <Text className="text-textSecondary text-s">{nextTrip.startDate.split('T')[0]}</Text>
        </View>

      </View>
    </ScrollView>
  )
}