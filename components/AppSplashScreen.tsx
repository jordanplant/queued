import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'

type Props = {
  onFadeComplete: () => void
}

export default function AppSplashScreen({ onFadeComplete }: Props) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => onFadeComplete())
    }, 1500)
    

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View
      style={{ opacity }}
      className="absolute inset-0 bg-background items-center justify-center z-10"
    >
      <View className="items-center gap-3">
      <Text className="text-accent font-bold tracking-widest" style={{ fontSize: 180 }}>
  QD
</Text>
        <Text className="text-textMuted text-lg tracking-wide">
          Your park day, sorted.
        </Text>
      </View>
    </Animated.View>
  )
}