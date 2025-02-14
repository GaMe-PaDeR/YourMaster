import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_ADDRESS } from "@/config";
import Service from "../entities/Service";
import User from "../entities/User";
import tokenService from "../services/tokenService";
import axios from "axios";

const staticFolder = "servicePictures";

const ServiceImage = ({ photoUrl }: { photoUrl: string }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [headers, setHeaders] = useState<{ Authorization: string } | null>(
    null
  );

  useEffect(() => {
    const setupImage = async () => {
      try {
        const token = await tokenService.getAccessToken();
        if (!token) {
          console.error("Токен не получен");
          return;
        }

        const response = await fetch(
          `${API_ADDRESS}files/${photoUrl}?folderName=${staticFolder}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          console.error(`Ошибка загрузки изображения: ${response.status}`);
          return;
        }

        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        setImageUrl(base64);
        setHeaders({
          Authorization: `Bearer ${token}`,
        });
      } catch (error) {
        console.error("Ошибка при настройке изображения:", error);
      }
    };

    setupImage();
  }, [photoUrl]);

  if (!imageUrl || !headers) {
    return null;
  }

  return (
    <Image
      source={{
        uri: imageUrl,
      }}
      className="w-full h-48 rounded-lg mb-2"
      onError={(error) => {
        console.error("Ошибка загрузки изображения:", {
          error: error.nativeEvent,
          url: imageUrl.substring(0, 100) + "...", // Логируем только начало URL для безопасности
        });
      }}
    />
  );
};

const HomeScreen = () => {
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [otherServices, setOtherServices] = useState<Service[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userRole, setUserRole] = useState<
    "ROLE_MASTER" | "ROLE_CLIENT" | null
  >(null);

  const fetchUserRole = async () => {
    try {
      const role = await tokenService.getRole();
      // console.log(role);
      setUserRole(role as "ROLE_MASTER" | "ROLE_CLIENT");
    } catch (error) {
      console.error("Ошибка при получении роли пользователя:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await tokenService.makeAuthenticatedRequest(
        {
          method: "get",
          url:
            userRole === "ROLE_MASTER"
              ? `${API_ADDRESS}services/master`
              : `${API_ADDRESS}services`,
        },
        () => router.push("/(auth)/loginScreen")
      );

      if (userRole === "ROLE_MASTER") {
        setMyServices(response.data.myOwnServices);
        setOtherServices(response.data.otherServices);
      } else {
        setOtherServices(response.data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert("Подтверждение", "Вы уверены, что хотите удалить эту услугу?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            const accessToken = await tokenService.getAccessToken();
            await axios.delete(`${API_ADDRESS}services/${serviceId}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            setMyServices(
              myServices.filter((service) => service.id !== serviceId)
            );
            Alert.alert("Успех", "Услуга успешно удалена");
          } catch (error) {
            console.error("Ошибка при удалении услуги:", error);
            Alert.alert("Ошибка", "Не удалось удалить услугу");
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchServices();
    }
  }, [userRole]);

  const renderServiceCard = ({ item }: { item: Service }) => {
    return (
      <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
        {item.photos && item.photos.length > 0 && (
          <ServiceImage photoUrl={item.photos[0]} />
        )}
        <Text className="text-lg font-bold mb-1">{item.title}</Text>
        <Text className="text-gray-600 mb-2">{item.description}</Text>
        <Text className="text-blue-500 mb-1">Категория: {item.category}</Text>
        <Text className="font-semibold mb-1">Цена: {item.price} ₽</Text>
        <Text className="mb-2">
          Длительность: {item.estimatedDuration} мин.
        </Text>
        <Text className="text-gray-600 mb-2">
          Мастер: {item.master.firstName} {item.master.lastName}
        </Text>

        <View className="flex-row justify-end">
          {userRole === "ROLE_MASTER" && item.master.id === item.master.id ? (
            <>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-lg mr-2"
                onPress={() =>
                  router.push({
                    pathname: "/(screens)/editService",
                    params: { id: item.id },
                  })
                }
              >
                <Text className="text-white">Редактировать</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-lg"
                onPress={() => handleDeleteService(item.id)}
              >
                <Text className="text-white">Удалить</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className="bg-green-500 px-4 py-2 rounded-lg"
              onPress={() =>
                router.push({
                  pathname: "/(screens)/bookService",
                  params: { id: item.id },
                })
              }
            >
              <Text className="text-white">Записаться</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View className="flex-1 bg-gray-100 pt-4">
      {userRole === "ROLE_MASTER" && (
        <Link href="/createNewService" asChild>
          <TouchableOpacity className="bg-blue-500 p-4 m-4 mt-2 rounded-lg flex-row items-center justify-center">
            <Ionicons name="add" size={24} color="white" />
            <Text className="text-white text-lg ml-2">
              Создать новую услугу
            </Text>
          </TouchableOpacity>
        </Link>
      )}

      <FlatList
        data={
          userRole === "ROLE_MASTER"
            ? [
                { title: "Мои услуги", data: myServices },
                { title: "Другие услуги", data: otherServices },
              ]
            : [{ title: "Доступные услуги", data: otherServices }]
        }
        renderItem={({ item: section }) => (
          <View className="px-4">
            <Text className="text-xl font-bold mb-4">{section.title}</Text>
            <FlatList
              data={section.data}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        className="flex-1"
      />
    </View>
  );
};

export default HomeScreen;
