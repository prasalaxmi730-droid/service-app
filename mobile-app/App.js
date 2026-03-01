import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./src/screens/LoginScreen";
import ServiceCallListScreen from "./src/screens/ServiceCallListScreen";
import ServiceCallDetailScreen from "./src/screens/ServiceCallDetailScreen";
import ServiceReportFormScreen from "./src/screens/ServiceReportFormScreen";
import { setAuthToken } from "./src/services/api";

const Stack = createNativeStackNavigator();

export default function App() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="ServiceCalls"
              component={ServiceCallListScreen}
              options={{ title: "Service Calls" }}
            />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
