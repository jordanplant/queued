import { Ionicons } from '@expo/vector-icons'
import { useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export type SwipeAction = {
  label?: string
  icon?: IconName
  color: string
  textColor?: string
  onPress: () => void
}

type Props = {
  actions: SwipeAction[]
  children: React.ReactNode
  marginBottom?: number
}

export default function SwipeableRow({ actions, children, marginBottom }: Props) {
  const swipeableRef = useRef<Swipeable>(null)

  const close = () => swipeableRef.current?.close()

  const renderRightActions = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: marginBottom ?? 12 }}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => { action.onPress(); close() }}
          className="justify-center items-center rounded-xl px-5"
          style={{ backgroundColor: action.color }}
        >
          {action.icon
            ? <Ionicons name={action.icon} size={22} color={action.textColor ?? '#0D0F14'} />
            : <Text className="font-semibold text-sm" style={{ color: action.textColor ?? '#0D0F14' }}>{action.label}</Text>
          }
        </TouchableOpacity>
      ))}
    </View>
  )

  return (
<Swipeable
  ref={swipeableRef}
  renderRightActions={renderRightActions}
  overshootRight={false}
  friction={3}
  rightThreshold={40}
  containerStyle={{ overflow: 'visible' }}
  childrenContainerStyle={{ opacity: 1 }}
>
      {children}
    </Swipeable>
  )
}