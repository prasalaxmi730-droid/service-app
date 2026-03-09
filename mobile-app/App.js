import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./src/screens/LoginScreen";
import SplashScreen from "./src/screens/SplashScreen";
import ServiceCallListScreen from "./src/screens/ServiceCallListScreen";
import ServiceCallDetailScreen from "./src/screens/ServiceCallDetailScreen";
import ServiceReportFormScreen from "./src/screens/ServiceReportFormScreen";
import ServiceReportListScreen from "./src/screens/ServiceReportListScreen";
import ServiceReportDetailScreen from "./src/screens/ServiceReportDetailScreen";
import { setAuthToken } from "./src/services/api";
import { theme } from "./src/theme";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerShadowVisible: false,
  headerTintColor: theme.colors.text,
  headerTitleStyle: {
    fontWeight: "700",
    fontSize: 17,
  },
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
};

export default function App() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = await AsyncStorage.getItem("authToken");
      if (savedToken) {
        setToken(savedToken);
        setAuthToken(savedToken);
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  const handleLogin = async newToken => {
    setToken(newToken);
    setAuthToken(newToken);
    await AsyncStorage.setItem("authToken", newToken);
  };

  const handleLogout = async () => {
    setToken("");
    setAuthToken("");
    await AsyncStorage.removeItem("authToken");
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!token ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="ServiceCalls"
              options={{ title: "Service Calls" }}
            >
              {props => (
                <ServiceCallListScreen
                  {...props}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ServiceCallDetail"
              component={ServiceCallDetailScreen}
              options={{ title: "Call Details" }}
            />
            <Stack.Screen
              name="ServiceReportForm"
              component={ServiceReportFormScreen}
              options={{ title: "Service Report" }}
            />
            <Stack.Screen
              name="ServiceReportList"
              component={ServiceReportListScreen}
              options={{ title: "Reports" }}
            />
            <Stack.Screen
              name="ServiceReportDetail"
              component={ServiceReportDetailScreen}
              options={{ title: "Report Details" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
