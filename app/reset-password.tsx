import Colors from "@/constants/Colors";
import { resetPassword } from "@/lib/auth";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ResetPassword() {
  const { userId, secret } = useLocalSearchParams<{
    userId: string;
    secret: string;
  }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in both fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!userId || !secret) {
      setError("This reset link is invalid or has expired");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(userId, secret, password);
      setDone(true);
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
          {done ? "Password updated" : "Set a new password"}
        </Text>
        <Text className="text-textSecondary text-sm mb-8">
          {done
            ? "You can now sign in with your new password in the Queued app."
            : "Choose a new password for your account."}
        </Text>

        {error ? (
          <Text className="text-red-400 text-sm mb-4">{error}</Text>
        ) : null}

        {!done && (
          <>
            <TextInput
              className="bg-surface text-text rounded-xl px-4 py-4 mb-3"
              placeholder="New password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              className="bg-surface text-text rounded-xl px-4 py-4 mb-3"
              placeholder="Confirm password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </>
        )}
      </View>

      {!done && (
        <View className="px-6 pb-12">
          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center"
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text className="text-background font-bold text-base">
                Update password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
