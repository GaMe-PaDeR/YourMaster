import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React from "react";
import "react-native-reanimated";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="loginScreen"
        options={{ headerShown: false, title: "" }}
      />
      <Stack.Screen
        name="forgotPasswordScreen"
        options={{ headerShown: true, title: "" }}
      />
      <Stack.Screen
        name="registerScreen"
        options={{ headerShown: true, title: "" }}
      />
      <Stack.Screen
        name="resetPasswordScreen"
        options={{ headerShown: true, title: "" }}
      />
      <Stack.Screen
        name="verifyEmailScreen"
        options={{ headerShown: true, title: "" }}
      />
    </Stack>
  );
}
