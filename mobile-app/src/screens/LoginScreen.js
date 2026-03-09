import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../services/api";
import { theme } from "../theme";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("technician");
  const [password, setPassword] = useState("ChangeMe123!");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Enter username and password");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/login", { username, password });
      onLogin(response.data.token, response.data.user);
    } catch (error) {
      Alert.alert("Login failed", error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.appLabel}>Field Service Platform</Text>
        <Text style={styles.heading}>Technician Login</Text>
        <Text style={styles.subheading}>Access your assigned calls and submit reports quickly.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor={theme.colors.textMuted}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login to Dashboard</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  appLabel: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subheading: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  label: {
    color: theme.colors.text,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  button: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
