import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import User from "@/entities/User";
import tokenService from "@/services/tokenService";
import { API_ADDRESS } from "@/config";
import authProvider from "@/services/authProvider";

// const ProfileScreen = () => {

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();

  // useEffect(() => {
  //   console.log(user);
  // }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authProvider.get(
          `${API_ADDRESS}users/currentUser`
        );
        console.log(response.data);
        setUser(User.fromJSON(response.data));

        // Получаем количество уведомлений
        const notificationsResponse = await authProvider.get(
          `${API_ADDRESS}notifications/count`
        );
        setNotificationCount(notificationsResponse.data.count);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти из аккаунта?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        onPress: () => {
          router.navigate("../(auth)/loginScreen"), tokenService.clearAll();
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("../(screens)/editProfile");
  };

  if (!user) {
    return <Text></Text>;
  }

  return (
    <View className="flex-1 p-4 bg-[#f9f9f9]">
      <View className="items-center mb-6">
        <View className="relative">
          <Image
            source={{
              uri: user.avatarUrl
                ? user.avatarUrl
                : "https://via.placeholder.com/100",
            }}
            className="w-24 h-24 rounded-full mb-4"
          />
          {notificationCount > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs">{notificationCount}</Text>
            </View>
          )}
        </View>
        <Text className="text-lg font-bold">
          {user.firstName} {user.lastName}
        </Text>
        <Text className="text-base text-gray-600">{user.email}</Text>
        <Text className="text-base text-gray-600">
          {user.role === "ROLE_MASTER" ? "Мастер" : "Клиент"}
        </Text>
        {user.city && user.country && (
          <Text className="text-base text-gray-600">
            {user.city}, {user.country}
          </Text>
        )}
        {user.birthday && (
          <Text className="text-base text-gray-600">
            {new Date(user.birthday).toLocaleDateString()}
          </Text>
        )}
        {user.gender === "male" || user.gender === "female" ? (
          <Text className="text-base text-gray-600">
            {user.gender === "male"
              ? "Мужчина"
              : user.gender === "female"
              ? "Женщина"
              : ""}
          </Text>
        ) : null}
        {user.description && (
          <Text className="text-base text-gray-600">{user.description}</Text>
        )}

        <TouchableOpacity
          className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
          onPress={handleEditProfile}
        >
          <Text className="text-white text-base">Редактировать профиль</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-3">
        <TouchableOpacity
          className="p-4 bg-white rounded-lg shadow"
          onPress={() => router.push("../(tabs)/RecordsScreen")}
        >
          <Text className="text-base text-black">История записей</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-3">
        <TouchableOpacity
          className="p-4 bg-white rounded-lg shadow"
          onPress={() => router.push("../(screens)/settingsScreen")}
        >
          <Text className="text-base text-black">Настройки</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-3">
        <TouchableOpacity
          className="p-4 bg-white rounded-lg shadow"
          onPress={() => router.push("../(screens)/NotificationsScreen")}
        >
          <Text className="text-base text-black">Уведомления</Text>
          {notificationCount > 0 && (
            <View className="absolute top-2 right-2 bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs">{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="p-4 bg-white rounded-lg shadow"
        onPress={handleLogout}
      >
        <Text className="text-red-500 text-base">Выйти</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
