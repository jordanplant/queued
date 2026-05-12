import { Text, View } from 'react-native'

export default function Today() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0D0F14]">
      <Text className="text-white text-2xl font-bold">Queued</Text>
      <Text className="text-[#9BA3B8] text-sm mt-2">Your park day, sorted.</Text>
    </View>
  )
}