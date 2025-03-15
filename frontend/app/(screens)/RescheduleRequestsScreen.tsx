import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

const RescheduleRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(`${API_ADDRESS}reschedule-requests`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // console.log("Response data:", response.data);
      setRequests(response.data);
    } catch (error) {
      console.error("Ошибка загрузки запросов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, accepted: boolean) => {
    try {
      const accessToken = await tokenService.getAccessToken();
      // console.log("ACCEPTED", accepted);

      await axios.put(
        `${API_ADDRESS}reschedule-requests/${requestId}/response?accepted=${accepted}`,
        null,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      fetchRequests();
    } catch (error) {
      console.error("Ошибка обработки запроса:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRequests();
    }, [])
  );

  const renderItem = ({ item }) => {
    // Преобразуем массив чисел в объект Date
    const parseArrayToDate = (dateArray: number[]) => {
      if (!Array.isArray(dateArray) || dateArray.length < 5) {
        return null;
      }
      const [year, month, day, hour, minute] = dateArray;
      return new Date(year, month - 1, day, hour, minute);
    };

    const date = parseArrayToDate(item.newDateTime);
    const formattedDate = date
      ? format(date, "d MMMM yyyy, HH:mm", { locale: ru })
      : "Дата не указана";

    return (
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-bold">Запрос на перенос</Text>
        <Text className="text-gray-600">Новая дата: {formattedDate}</Text>
        <Text className="text-gray-600">
          Инициатор: {item.requester.firstName} {item.requester.lastName}
        </Text>

        {item.status === "PENDING" && (
          <View className="flex-row mt-2 space-x-2">
            <TouchableOpacity
              className="flex-1 bg-green-500 p-2 rounded-lg"
              onPress={() => handleResponse(item.id, true)}
            >
              <Text className="text-white text-center">Принять</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-500 p-2 rounded-lg"
              onPress={() => handleResponse(item.id, false)}
            >
              <Text className="text-white text-center">Отклонить</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status !== "PENDING" && (
          <Text
            className={`mt-2 ${
              item.status === "ACCEPTED" ? "text-green-600" : "text-red-600"
            }`}
          >
            Статус: {item.status === "ACCEPTED" ? "Принято" : "Отклонено"}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <ActivityIndicator className="flex-1" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-4">
              Нет активных запросов на перенос
            </Text>
          }
        />
      )}
    </View>
  );
};

export default RescheduleRequestsScreen;
