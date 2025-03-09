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
  AppState,
  AppStateStatus,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_ADDRESS } from "@/config";
import Service from "@/entities/Service";
import User from "@/entities/User";
import tokenService from "@/services/tokenService";
import axios from "axios";
import { STATIC_FOLDER } from "@/config";
import authProvider from "@/services/authProvider";

// const staticFolder = "servicePictures";

const ServiceImage = ({ photoUrl }: { photoUrl: string }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [headers, setHeaders] = useState<{ Authorization: string } | null>(
    null
  );

  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //     if (nextAppState === "background" || nextAppState === "inactive") {
  //       try {
  //         const accessToken = await tokenService.getAccessToken();
  //         if (accessToken) {
  //           await axios.put(
  //             `${API_ADDRESS}users/toggleOnline`,
  //             {},
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${accessToken}`,
  //               },
  //             }
  //           );
  //         }
  //         console.log("App state changed to:", nextAppState);
  //         console.log("User online/offline status updated");
  //       } catch (error) {
  //         console.error("Ошибка обновления статуса:", error);
  //       }
  //     }
  //   };

  //   const subscription = AppState.addEventListener(
  //     "change",
  //     handleAppStateChange
  //   );
  //   return () => subscription.remove();
  // }, []);

  useEffect(() => {
    const setupImage = async () => {
      try {
        const token = await tokenService.getAccessToken();
        if (!token) {
          console.error("Токен не получен");
          return;
        }

        const response = await fetch(
          `${API_ADDRESS}files/${photoUrl}?folderName=${STATIC_FOLDER}`,
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUserRole = async () => {
    try {
      const role = await tokenService.getRole();
      const user = await tokenService.getUser();
      setUserRole(role as "ROLE_MASTER" | "ROLE_CLIENT");
      setCurrentUser(user);
    } catch (error) {
      console.error("Ошибка при получении роли пользователя:", error);
    }
  };

  const fetchServices = async () => {
    try {
      // console.log("FETCH SERVICES");
      const response = await tokenService.makeAuthenticatedRequest(
        {
          method: "get",
          url:
            userRole === "ROLE_MASTER"
              ? `${API_ADDRESS}services/master`
              : `${API_ADDRESS}services`,
        },
        () => router.push("../(auth)/loginScreen")
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
    const isMyService = myServices.some((service) => service.id === item.id);

    const handleMessageMaster = async (masterId: string) => {
      try {
        // Проверяем существующий чат
        const checkResponse = await authProvider.get(
          `${API_ADDRESS}chats/check`,
          {
            params: { recipientId: masterId },
          }
        );

        const chatId = (
          checkResponse.data as { exists: boolean; chatId: string }
        ).exists
          ? (checkResponse.data as { exists: boolean; chatId: string }).chatId
          : (
              await authProvider.post<{ id: string }>(
                `${API_ADDRESS}chats/single`,
                {
                  recipientId: masterId,
                }
              )
            ).data.id;

        // Получаем данные мастера
        const masterResponse = await authProvider.get(
          `${API_ADDRESS}users/${masterId}`
        );

        router.push({
          pathname: "../(screens)/ChatDetailScreen",
          params: {
            chatId,
            chatName: `${
              (masterResponse.data as { firstName: string; lastName: string })
                .firstName
            } ${
              (masterResponse.data as { firstName: string; lastName: string })
                .lastName
            }`,
            participants: JSON.stringify([
              masterResponse.data as { firstName: string; lastName: string },
            ]),
            isGroup: "false",
          },
        });
      } catch (error) {
        console.error("Ошибка создания/перехода в чат:", error);
        Alert.alert("Ошибка", "Не удалось начать диалог с мастером");
      }
    };

    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        {item.photos && item.photos.length > 0 && (
          <ServiceImage photoUrl={item.photos[0]} />
        )}

        <View className="border-b border-gray-200 pb-3 mb-3">
          <Text className="text-xl font-bold text-gray-800 mb-1">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm mb-2">{item.description}</Text>

          <View className="flex-row items-center mb-1">
            <Ionicons name="pricetag" size={16} color="#4F46E5" />
            <Text className="text-blue-600 ml-2 text-sm">{item.category}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="wallet" size={16} color="#10B981" />
              <Text className="text-green-600 ml-2 text-sm">
                {item.price} ₽
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="time" size={16} color="#EF4444" />
              <Text className="text-red-600 ml-2 text-sm">
                {item.estimatedDuration} мин.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="person" size={16} color="#6B7280" />
            <Text className="text-gray-600 ml-2 text-sm">
              {item.master.firstName} {item.master.lastName}
            </Text>
          </View>

          <View className="flex-row gap-2">
            {userRole === "ROLE_MASTER" && isMyService ? (
              <>
                <TouchableOpacity
                  className="bg-blue-100 p-2 rounded-full flex-row items-center"
                  onPress={() =>
                    router.push({
                      pathname: "../(screens)/editService",
                      params: { id: item.id },
                    })
                  }
                >
                  <Ionicons name="create" size={20} color="#2563EB" />
                  <Text className="text-blue-600 ml-1 text-sm hidden md:inline">
                    Редактировать
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-red-100 p-2 rounded-full flex-row items-center"
                  onPress={() => handleDeleteService(item.id)}
                >
                  <Ionicons name="trash" size={20} color="#DC2626" />
                  <Text className="text-red-600 ml-1 text-sm hidden md:inline">
                    Удалить
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className="bg-green-100 p-2 rounded-full flex-row items-center"
                  onPress={() =>
                    router.push({
                      pathname: "../(screens)/bookService",
                      params: { id: item.id },
                    })
                  }
                >
                  <Ionicons name="calendar" size={20} color="#059669" />
                  <Text className="text-green-700 ml-1 text-sm hidden md:inline">
                    Записаться
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-purple-100 p-2 rounded-full flex-row items-center"
                  onPress={() => handleMessageMaster(item.master.id)}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={20}
                    color="#7C3AED"
                  />
                  <Text className="text-purple-700 ml-1 text-sm hidden md:inline">
                    Написать
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
        <Link href="../(screens)/createNewService" asChild>
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
