import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import User from "@/entities/User";
import authProvider from "@/services/authProvider";
import {
  sendTestPushNotification,
  setupNotificationListeners,
} from "@/services/notificationService";
import { registerForPushNotificationsAsync } from "@/services/notificationService";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const router = useRouter();

  useEffect(() => {
    setupNotificationListeners(router);
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const response = await authProvider.get(`${API_ADDRESS}notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await authProvider.put(
        `${API_ADDRESS}notifications/${notificationId}/read`
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();

      const setupWebSocket = async () => {
        const token = await tokenService.getAccessToken();
        const user: User = await tokenService.getUser();
        const userId = user.id;

        const socket = new SockJS(`${API_ADDRESS.replace("http", "ws")}/ws`);
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: { Authorization: `Bearer ${token}` },
          onConnect: () => {
            client.subscribe(
              `/user/${userId}/queue/notifications`,
              (message) => {
                const notification = JSON.parse(message.body);
                setNotifications((prev) => [notification, ...prev]);
              }
            );
          },
        });

        client.activate();
        setStompClient(client);
      };

      setupWebSocket();

      return () => {
        if (stompClient) {
          stompClient.deactivate();
        }
      };
    }, [])
  );

  const handleTestPush = async () => {
    try {
      // Получаем push-токен
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) {
        Alert.alert("Ошибка", "Push-токен не получен");
        return;
      }

      // Отправляем тестовое уведомление
      await sendTestPushNotification({ token: pushToken });
      Alert.alert("Успех", "Тестовое уведомление отправлено");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить тестовое уведомление");
    }
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-4">Уведомления</Text>

      <TouchableOpacity
        className="bg-blue-500 p-2 rounded-lg mb-4"
        onPress={handleTestPush}
      >
        <Text className="text-white text-center">
          Отправить тестовое уведомление
        </Text>
      </TouchableOpacity>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`p-4 mb-2 bg-white rounded-lg shadow-sm ${
              item.read ? "opacity-60" : ""
            }`}
            onPress={() => markAsRead(item.id)}
          >
            <Text className="text-base">{item.message}</Text>
            {!item.read && (
              <View className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2" />
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default NotificationsScreen;
