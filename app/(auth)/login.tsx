import { useAuth } from '@/context/AuthContext'
import { getCurrentUser, login } from '@/lib/auth'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuth()

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
    <View className="flex-1 bg-[#0D0F14]">

      <View className="flex-1 justify-center px-6 pb-8">
        <Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
        <Text className="text-[#9BA3B8] text-sm mb-8">Sign in to Queued</Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        <TextInput
          className="bg-[#1C2030] text-white rounded-xl px-4 py-4 mb-3"
          placeholder="Email"
          placeholderTextColor="#9BA3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="bg-[#1C2030] text-white rounded-xl px-4 py-4 mb-3"
          placeholder="Password"
          placeholderTextColor="#9BA3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View className="px-6 pb-12">
        <TouchableOpacity
          className="bg-[#00E5FF] rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0D0F14" />
            : <Text className="text-[#0D0F14] font-bold text-base">Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-[#9BA3B8] text-sm text-center">
            Don't have an account? <Text className="text-[#00E5FF]">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}