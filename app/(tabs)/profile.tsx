import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/auth'
import { Trip, deleteTrip, getTrips } from '@/services/trips'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getTrips(user.$id)
      .then(setTrips)
      .catch(console.error)
      .finally(() => setTripsLoading(false))
  }, [user])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      setUser(null)
      router.replace('/(auth)/login')
    } catch (e: any) {
      console.log('logout error', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tripId: string) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(tripId)
              setTrips(prev => prev.filter(t => t.$id !== tripId))
            } catch (e) {
              console.error(e)
            }
          }
        }
      ]
    )
  }

  const renderRightActions = (tripId: string) => (
    <View className="flex-row mb-3 gap-2">
      <TouchableOpacity
        className="bg-[#00E5FF] justify-center items-center rounded-xl px-6"
        onPress={() => router.push(`/trip/${tripId}?edit=true&from=profile` as any)}
      >
        <Text className="text-[#0D0F14] font-semibold">Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-red-500 justify-center items-center rounded-xl px-6"
        onPress={() => handleDelete(tripId)}
      >
        <Text className="text-white font-semibold">Delete</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView className="flex-1 bg-[#0D0F14]">
      <View className="px-6 pt-16 pb-8">

        {/* User info */}
        <Text className="text-white text-2xl font-bold mb-1">{user?.name}</Text>
        <Text className="text-[#9BA3B8] text-sm mb-8">{user?.email}</Text>

        {/* Trips */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-semibold">My Trips</Text>
          <TouchableOpacity
            className="bg-[#00E5FF] px-4 py-2 rounded-xl"
            onPress={() => router.push('/trip/new?from=profile')}
          >
            <Text className="text-[#0D0F14] font-bold text-sm">+ New Trip</Text>
          </TouchableOpacity>
        </View>

        {tripsLoading ? (
          <ActivityIndicator color="#00E5FF" />
        ) : trips.length === 0 ? (
          <View className="bg-[#1C2030] rounded-xl p-6 items-center">
            <Text className="text-[#9BA3B8] text-sm text-center">
              No trips yet. Create your first one!
            </Text>
          </View>
        ) : (
          trips.map((trip) => (
            <Swipeable
              key={trip.$id}
              renderRightActions={() => renderRightActions(trip.$id)}
              overshootRight={false}
            >
              <TouchableOpacity
                className="bg-[#1C2030] rounded-xl p-4 mb-3"
                onPress={() => router.push(`/trip/${trip.$id}?from=profile` as any)}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white font-semibold text-base">{trip.name}</Text>
                  <View className={`px-2 py-1 rounded-full ${
                    trip.status === 'active' ? 'bg-green-500' :
                    trip.status === 'upcoming' ? 'bg-[#00E5FF]' : 'bg-[#2E3350]'
                  }`}>
                    <Text className="text-xs font-medium text-[#0D0F14]">{trip.status}</Text>
                  </View>
                </View>
                <Text className="text-[#9BA3B8] text-sm mt-1">
                  {trip.startDate.split('T')[0]} → {trip.endDate.split('T')[0]}
                </Text>
              </TouchableOpacity>
            </Swipeable>
          ))
        )}

        {/* Logout */}
        <TouchableOpacity
          className="bg-[#1C2030] rounded-xl py-4 items-center mt-8"
          onPress={handleLogout}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#00E5FF" />
            : <Text className="text-red-400 font-semibold">Log out</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}