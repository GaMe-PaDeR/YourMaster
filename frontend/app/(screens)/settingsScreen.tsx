import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";

const SettingsScreen = () => {
  const [isNotificationsEnabled, setNotificationsEnabled] =
    React.useState(true);
  const [isDarkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const handleToggleDarkMode = () => {
    setDarkModeEnabled((prev) => !prev);
  };

  return (
    <View className="flex-1 p-4">
      {/* Уведомления */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg">Уведомления</Text>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={handleToggleNotifications}
        />
      </View>

      {/* Темная тема */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg">Темная тема</Text>
        <Switch
          value={isDarkModeEnabled}
          onValueChange={handleToggleDarkMode}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  backButton: {
    marginTop: "auto",
    padding: 16,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default SettingsScreen;
