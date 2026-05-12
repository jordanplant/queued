import { router, useLocalSearchParams } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

export default function TripDetail() {
  const { id } = useLocalSearchParams()

  return (
    <View className="flex-1 bg-[#0D0F14] px-6 pt-16">
      <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} className="mb-6">
        <Text className="text-[#00E5FF] text-sm">← Back</Text>
      </TouchableOpacity>
      <Text className="text-white text-2xl font-bold">Trip Detail</Text>
      <Text className="text-[#9BA3B8] text-sm mt-2">{id}</Text>
    </View>
  )
}