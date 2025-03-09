import { Tabs } from "expo-router";
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Badge } from "react-native-paper";
import { View, StyleSheet } from "react-native";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import authProvider from "@/services/authProvider";
import { router } from "expo-router";
import { API_ADDRESS } from "@/config";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadChats, setUnreadChats] = useState(0);

  const fetchUnreadChats = async () => {
    try {
      const response = await authProvider.get<{ data: number }>(
        `${API_ADDRESS}chats/current-user/unread-chats`
      );
      console.log(response.data);
      setUnreadChats(response.data);
    } catch (error: any) {
      console.error(
        "Ошибка получения чатов с непрочитанными сообщениями:",
        error
      );
      if (error.response?.status === 401) {
        router.navigate("../(auth)/loginScreen");
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadChats();
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="RecordsScreen"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ChatScreen"
        options={{
          title: "",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <TabBarIcon name="chatbubble" color={color} />
              {unreadChats > 0 && (
                <Badge size={18} style={styles.badge}>
                  {unreadChats}
                </Badge>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "red",
    zIndex: 1,
  },
});
