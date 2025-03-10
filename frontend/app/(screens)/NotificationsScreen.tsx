import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import { Notification } from "@/entities/Notification";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (reset = false) => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await fetch(
        `${API_ADDRESS}notifications?page=${reset ? 0 : page}&size=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      // console.log(" 1 ", data.content);
      setNotifications((prev) =>
        reset ? data.content : [...prev, ...data.content]
      );
      setHasMore(!data.last);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const accessToken = await tokenService.getAccessToken();
      await fetch(`${API_ADDRESS}notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const accessToken = await tokenService.getAccessToken();
      await fetch(`${API_ADDRESS}notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      await fetch(`${API_ADDRESS}notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      await fetch(`${API_ADDRESS}notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchNotifications(true);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [page])
  );

  const formatCustomDate = (dateArray: number[]) => {
    try {
      // Проверяем, что массив содержит хотя бы 6 элементов (год, месяц, день, час, минута, секунда)
      if (!Array.isArray(dateArray) || dateArray.length < 6) {
        return "Неизвестная дата";
      }

      // Извлекаем компоненты даты
      const [year, month, day, hour, minute, second] = dateArray;

      // Создаем объект Date
      const date = new Date(year, month - 1, day, hour, minute, second);

      // Проверяем валидность даты
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      // Форматируем дату
      return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
    } catch (error) {
      console.error("Error formatting date:", error);
      // Возвращаем исходную строку, если не удалось распарсить
      return "Неизвестная дата";
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View
      className={`flex-row items-center mx-4 my-2 p-4 rounded-lg shadow-sm ${
        !item.read ? "bg-blue-50 border-l-4 border-blue-500" : "bg-white"
      }`}
    >
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          <Text className="text-lg font-semibold text-gray-800">
            {item.title}
          </Text>
          {!item.read && (
            <Ionicons
              name="ellipse"
              size={12}
              color="#3B82F6"
              className="ml-2"
            />
          )}
        </View>
        <Text className="text-base text-gray-600 mb-2">{item.message}</Text>
        <Text className="text-sm text-gray-400">
          {formatCustomDate(item.createdAt)}
        </Text>
      </View>
      <View className="flex-row items-center">
        {!item.read && (
          <TouchableOpacity onPress={() => markAsRead(item.id)} className="p-2">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          className="p-2"
        >
          <Ionicons name="trash-outline" size={20} className="text-red-500" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={markAllAsRead}
          className="flex-row items-center bg-green-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="checkmark-circle" size={20} className="text-white" />
          <Text className="text-white font-medium ml-2">Прочитать все</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={clearAllNotifications}
          className="flex-row items-center bg-red-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="trash" size={20} className="text-white" />
          <Text className="text-white font-medium ml-2">Очистить все</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={() => hasMore && setPage((prev) => prev + 1)}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          loading ? <ActivityIndicator size="small" color="#0000ff" /> : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons
              name="notifications-off"
              size={50}
              className="text-gray-300"
            />
            <Text className="text-lg text-gray-400 mt-4">Нет уведомлений</Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;
