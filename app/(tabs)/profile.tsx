import SwipeableRow from '@/components/SwipeableRow'
import Colors from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/auth'
import { Trip, deleteTrip, getTrips } from '@/services/trips'
import { router } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const { colorScheme } = useColorScheme()
const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

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
          },
        },
      ]
    )
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8">

        {/* User info */}
        <Text className="text-text text-2xl font-bold mb-1">{user?.name}</Text>
        <Text className="text-textSecondary text-sm mb-8">{user?.email}</Text>

        {/* Trips */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-text text-lg font-semibold">My Trips</Text>
          <TouchableOpacity
            className="bg-accent px-4 py-2 rounded-xl"
            onPress={() => router.push('/trip/new?from=profile')}
          >
            <Text className="text-background font-bold text-sm">+ New Trip</Text>
          </TouchableOpacity>
        </View>

        {tripsLoading ? (
          <ActivityIndicator color={theme.accent} />
        ) : trips.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-textSecondary text-sm text-center">
              No trips yet. Create your first one!
            </Text>
          </View>
        ) : (
          trips.map((trip) => (
            <SwipeableRow
              key={trip.$id}
              actions={[
                {
                  label: 'Edit',
                  color: theme.accent,
                  onPress: () => router.push(`/trip/${trip.$id}?edit=true&from=profile` as any),
                },
                {
                  label: 'Delete',
                  color: '#EF4444',
                  textColor: '#FFFFFF',
                  onPress: () => handleDelete(trip.$id),
                },
              ]}
            >
              <Pressable
                onPress={() => router.push(`/trip/${trip.$id}?from=profile` as any)}
              >
                {({ pressed }) => (
                  <View style={{
                    backgroundColor: pressed ? theme.border : theme.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-text font-semibold text-base">{trip.name}</Text>
                      <View className={`px-2 py-1 rounded-full ${
                        trip.status === 'active' ? 'bg-green-500' :
                        trip.status === 'upcoming' ? 'bg-accent' : 'bg-border'
                      }`}>
                        <Text className="text-xs font-medium text-background">{trip.status}</Text>
                      </View>
                    </View>
                    <Text className="text-textSecondary text-sm mt-1">
                      {trip.startDate.split('T')[0]} → {trip.endDate.split('T')[0]}
                    </Text>
                  </View>
                )}
              </Pressable>
            </SwipeableRow>
          ))
        )}

        {/* Logout */}
        <TouchableOpacity
          className="bg-surface rounded-xl py-4 items-center mt-8"
          onPress={handleLogout}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={theme.accent} />
            : <Text className="text-red-400 font-semibold">Log out</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}