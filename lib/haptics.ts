import * as Haptics from 'expo-haptics'

export const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  Haptics.impactAsync(style)
}