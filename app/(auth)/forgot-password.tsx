import Colors from "@/constants/Colors";
import { forgotPassword } from "@/lib/auth";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const handleSend = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6 pb-8">
        <Text className="text-text text-3xl font-bold mb-2">
          Reset password
        </Text>
        <Text className="text-textSecondary text-sm mb-8">
          {sent
            ? "Check your email for a link to reset your password."
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        {!sent && (
          <TextInput
            className="bg-surface text-text rounded-xl px-4 py-4 mb-3"
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        )}
      </View>

      <View className="px-6 pb-12">
        {!sent && (
          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center mb-4"
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text className="text-background font-bold text-base">
                Send reset link
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-textSecondary text-sm text-center">
            <Text className="text-accent">Back to sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
