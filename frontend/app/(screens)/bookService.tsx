import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import { API_ADDRESS } from "@/config";
import tokenService from "../services/tokenService";
import { Calendar } from "react-native-calendars";
import Service from "../entities/Service";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookService() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDate]);

  const fetchServiceDetails = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(`${API_ADDRESS}services/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setService(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке данных услуги:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные услуги");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimeSlots = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(
        `${API_ADDRESS}services/${id}/available-slots`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            date: selectedDate,
          },
        }
      );
      setAvailableTimeSlots(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке доступного времени:", error);
      Alert.alert("Ошибка", "Не удалось загрузить доступное время");
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Ошибка", "Выберите дату и время");
      return;
    }

    try {
      const accessToken = await tokenService.getAccessToken();
      await axios.post(
        `${API_ADDRESS}bookings/create`,
        {
          serviceId: id,
          date: selectedDate,
          time: selectedTime,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      Alert.alert("Успех", "Услуга успешно забронирована", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Ошибка при бронировании:", error);
      Alert.alert("Ошибка", "Не удалось забронировать услугу");
    }
  };

  if (loading || !service) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {service.photos && service.photos.length > 0 && (
          <Image
            source={{ uri: service.photos[0] }}
            className="w-full h-48 rounded-lg mb-4"
          />
        )}

        <Text className="text-2xl font-bold mb-2">{service.title}</Text>
        <Text className="text-gray-600 mb-4">{service.description}</Text>

        <View className="bg-gray-100 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold mb-2">
            Информация об услуге:
          </Text>
          <Text className="mb-1">Цена: {service.price} ₽</Text>
          <Text className="mb-1">
            Длительность: {service.estimatedDuration} мин.
          </Text>
          <Text className="mb-1">
            Мастер: {service.master.firstName} {service.master.lastName}
          </Text>
        </View>

        <Text className="text-lg font-semibold mb-2">Выберите дату:</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#4299e1" },
          }}
          minDate={format(new Date(), "yyyy-MM-dd")}
          theme={{
            todayTextColor: "#4299e1",
            selectedDayBackgroundColor: "#4299e1",
          }}
        />

        {selectedDate && (
          <View className="mt-4">
            <Text className="text-lg font-semibold mb-2">Выберите время:</Text>
            <View className="flex-row flex-wrap">
              {availableTimeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  className={`m-1 p-2 rounded-lg ${
                    slot.available
                      ? selectedTime === slot.time
                        ? "bg-blue-500"
                        : "bg-blue-100"
                      : "bg-gray-200"
                  }`}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    className={`${
                      selectedTime === slot.time ? "text-white" : "text-black"
                    } ${!slot.available && "text-gray-400"}`}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          className={`mt-6 p-4 rounded-lg ${
            selectedDate && selectedTime ? "bg-blue-500" : "bg-gray-300"
          }`}
          onPress={handleBooking}
          disabled={!selectedDate || !selectedTime}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Забронировать
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
