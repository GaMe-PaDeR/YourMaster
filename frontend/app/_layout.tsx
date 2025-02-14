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

const saveToken = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
  } catch (error) {
    console.error("Ошибка при сохранении токенов:", error);
  }
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  // const Stack = createNativeStackNavigator();
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showIndexScreen, setShowIndexScreen] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // useEffect(() => {
  //   const responseText = null;
  //   const refreshToken = AsyncStorage.getItem('refreshToken');
  //   const body = "{'refreshToken':" + refreshToken + "}";
  //   if (refreshToken != null) {
  //     const responseData = axios.post('http://192.168.1.8:8080/api/v1/auth/refresh', { refreshToken }, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     })
  //     .then((response) => {
  //       const { accessToken, refreshToken } = response.data;
  //       saveToken(accessToken, refreshToken);
  //       setIsAuthenticated(true);
  //     })
  //     .catch((error) => {
  //       console.error('Ошибка при обновлении токена:', error);
  //     });
  //   } else {
  //     setIsAuthenticated(false);
  //   }
  // }, []);

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

  if (!loaded) {
    return null;
  }

  return (
    // <NavigationContainer>
    <RootSiblingParent>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName="index">
          {/* {showIndexScreen && (
            <Stack.Screen name="index" options={{ headerShown: false}}/>
          )}
          {isAuthenticated ? (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          )} */}
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </RootSiblingParent>
    // </NavigationContainer>
  );
}
