import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useNavigation } from "expo-router";
import React from "react";
import "react-native-reanimated";

export default function ScreensLayout() {
  const navigation = useNavigation();

  return (
    <Stack>
      <Stack.Screen
        name="editProfile"
        options={{ headerShown: true, title: "Редактирование профиля" }}
      />
      <Stack.Screen
        name="settingsScreen"
        options={{ headerShown: true, title: "Настройки" }}
      />
      <Stack.Screen
        name="RecordDetailsScreen"
        options={{ headerShown: true, title: "Услуга" }}
      />
      <Stack.Screen
        name="createNewService"
        options={{ headerShown: true, title: "Создать услугу" }}
      />
      <Stack.Screen
        name="ChatDetailScreen"
        options={{ headerShown: false, title: "Чат" }}
      />
      <Stack.Screen
        name="bookService"
        options={{ headerShown: true, title: "Запись" }}
      />
      <Stack.Screen
        name="editService"
        options={{ headerShown: true, title: "Редактирование услуги" }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        options={{ headerShown: true, title: "Уведомления" }}
      />
      <Stack.Screen
        name="RescheduleRequestsScreen"
        options={{ headerShown: true, title: "Запросы на перенос" }}
      />
    </Stack>
  );
}
