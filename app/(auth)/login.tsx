import Colors from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { getCurrentUser, login } from '@/lib/auth'
import { router } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuth()
  const { colorScheme } = useColorScheme()
const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      const user = await getCurrentUser()
      setUser(user as any)
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-background">

      <View className="flex-1 justify-center px-6 pb-8">
        <Text className="text-text text-3xl font-bold mb-2">Welcome back</Text>
        <Text className="text-textSecondary text-sm mb-8">Sign in to Queued</Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        <TextInput
          className="bg-surface text-text rounded-xl px-4 py-4 mb-3"
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="bg-surface text-text rounded-xl px-4 py-4 mb-3"
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View className="px-6 pb-12">
        <TouchableOpacity
          className="bg-accent rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={theme.background} />
            : <Text className="text-background font-bold text-base">Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-textSecondary text-sm text-center">
            Don't have an account? <Text className="text-accent">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}