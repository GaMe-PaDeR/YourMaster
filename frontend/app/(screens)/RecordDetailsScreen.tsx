import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Record from "../entities/Record";
import { TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import tokenService from "../services/tokenService";
import Service from "../entities/Service";
import { useState, useEffect } from "react";
import User from "../entities/User";

type RecordDetailsScreenProps = {
  service: string;
};

const RecordDetailsScreen = ({
  service: serviceString,
}: RecordDetailsScreenProps) => {
  const [service, setService] = useState<Service | null>(null);
  const [master, setMaster] = useState<User | null>(null);
  const navigation = useNavigation();
  const router = useRouter();

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
    </View>
  );
};

export default RecordDetailsScreen;
