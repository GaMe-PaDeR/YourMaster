import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useState, useEffect } from "react";
import { RootSiblingParent } from "react-native-root-siblings";
import "react-native-reanimated";
// import createNativeStackNavigator from "@react-navigation/native-stack";

import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
// import { initNotificationService } from "@/services/notificationService";
import "../utils/sockjs-polyfill";
import tokenService from "@/services/tokenService";
import { AppState, AppStateStatus } from "react-native";
import { API_ADDRESS } from "@/config";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "expo-router";
import { NotificationProvider } from "@/contexts/NotificationContext";

const saveToken = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
  } catch (error) {
    console.error("Ошибка при сохранении токенов:", error);
  }
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  // const Stack = createNativeStackNavigator();
  const [accessToken, setAccessToken] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showIndexScreen, setShowIndexScreen] = useState(true);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const loadToken = async () => {
      const token = await tokenService.getAccessToken();
      setAccessToken(token || "");
    };
    loadToken();
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        setIsAuthenticated(!!refreshToken);
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
      if (isFirstLaunch === null) {
        setShowIndexScreen(true);
        await AsyncStorage.setItem("isFirstLaunch", "false");
      } else {
        setShowIndexScreen(false);
      }
    };
    checkFirstLaunch();
  }, []);

  // useEffect(() => {
  //   const initializeSocket = async () => {
  //     await initNotificationService();
  //   };
  //   initializeSocket();
  // }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NotificationProvider>
      <RootSiblingParent>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <Stack.Screen name="(tabs)" />
            ) : (
              <Stack.Screen name="(auth)" />
            )}
          </Stack>
        </ThemeProvider>
      </RootSiblingParent>
    </NotificationProvider>
  );
}
