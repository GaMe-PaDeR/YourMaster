import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Record from "@/entities/Record";
import { TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import tokenService from "@/services/tokenService";
import Service from "@/entities/Service";
import { useState, useEffect } from "react";
import User from "@/entities/User";
import { useNavigation as useNativeNavigation } from "@react-navigation/native";
import axios from "axios";
import { API_ADDRESS } from "@/config";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import authProvider from "@/services/authProvider";

type RootStackParamList = {
  ChatDetail: { chatId: string; chatName: string };
  //... другие маршруты
};

type RecordDetailsScreenProps = {
  service: string;
};

const RecordDetailsScreen = ({
  service: serviceString,
}: RecordDetailsScreenProps) => {
  const [service, setService] = useState<Service | null>(null);
  const [master, setMaster] = useState<User | null>(null);
  const router = useRouter();
  const nativeNavigation = useNativeNavigation();

  useEffect(() => {
    const fetchService = async () => {
      try {
        const serviceString = await tokenService.getItem("service");

        if (serviceString) {
          setService(Service.fromJSON(serviceString));
        } else {
          console.error("No service data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchService();
  }, []);

  // useEffect(() => {
  //   if (service) {
  //     setMaster(service.master as User);
  //     console.log(master);
  //   }
  // }, [service]);

  if (!service) {
    return <Text>Loading...</Text>;
  }

  return (
    <View className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold">{service.title}</Text>
      <Text className="text-base mt-1">
        Мастер: {service.master.firstName} {service.master.lastName} -{" "}
        {service.master.email}
      </Text>
      <Text className="text-base mt-1">Услуга: {service.description}</Text>
      <Text className="text-base mt-1">Цена: {service.price} руб.</Text>
      <View className="flex-row mt-4">
        <TouchableOpacity
          className="flex-1 bg-blue-500 p-2 mx-1 rounded"
          onPress={() =>
            Alert.alert("Перенос записи", "Эта функция еще не реализована")
          }
        >
          <Text className="text-white text-center">Перенести запись</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-red-500 p-2 mx-1 rounded"
          onPress={() =>
            Alert.alert("Отмена записи", "Эта функция еще не реализована")
          }
        >
          <Text className="text-white text-center">Отменить запись</Text>
        </TouchableOpacity>
      </View>
      {service.master.role === "ROLE_CLIENT" && (
        <TouchableOpacity
          className="flex-1 bg-green-500 p-2 mx-1 rounded"
          onPress={async () => {
            try {
              const response = await authProvider.post(
                `${API_ADDRESS}chats/single`,
                { recipientId: service.master.id }
              );

              // Обновляем список чатов после создания
              await authProvider.get(`${API_ADDRESS}chats/user/current`);

              router.push({
                pathname: "../(screens)/ChatDetailScreen",
                params: {
                  chatId: (response.data as { id: string }).id,
                  chatName:
                    (response.data as { chatName?: string }).chatName ||
                    service.master.firstName,
                },
              });
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось начать чат");
            }
          }}
        >
          <Text className="text-white text-center">Написать мастеру</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RecordDetailsScreen;
