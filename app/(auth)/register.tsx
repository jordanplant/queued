import { useAuth } from '@/context/AuthContext'
import { getCurrentUser, register } from '@/lib/auth'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuth()

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(email, password, name)
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
        <Text className="text-white text-3xl font-bold mb-2">Create account</Text>
        <Text className="text-[#9BA3B8] text-sm mb-8">Start planning your trip</Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        <TextInput
          className="bg-[#1C2030] text-white rounded-xl px-4 py-4 mb-3"
          placeholder="Name"
          placeholderTextColor="#9BA3B8"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />

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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0D0F14" />
            : <Text className="text-[#0D0F14] font-bold text-base">Create account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#9BA3B8] text-sm text-center">
            Already have an account? <Text className="text-[#00E5FF]">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}