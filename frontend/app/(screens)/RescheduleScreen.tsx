import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Calendar, DateData } from "react-native-calendars";
import { format, parseISO } from "date-fns";
import axios from "axios";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import { debounce } from "lodash";
import authProvider from "@/services/authProvider";

interface TimeSlotResponse {
  time: string;
  available: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const RescheduleScreen = () => {
  const { recordId } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableDates = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get<string[]>(
        `${API_ADDRESS}reschedule-requests/${recordId}/available-dates`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setAvailableDates(response.data);
    } catch (error) {
      console.error("Ошибка загрузки дат:", error);
    }
  };

  const fetchAvailableTimeSlots = async (date: string) => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get<TimeSlotResponse[]>(
        `${API_ADDRESS}reschedule-requests/${recordId}/available-slots`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { date },
        }
      );

      // Преобразуем ответ в формат TimeSlot
      const slots = response.data.map((slot) => ({
        time: slot.time,
        available: slot.available,
      }));

      setAvailableTimeSlots(slots);
      console.log("Available slots:", slots);
    } catch (error) {
      console.error("Ошибка загрузки слотов:", error);
      Alert.alert("Ошибка", "Не удалось загрузить доступные слоты");
    }
  };

  const handleReschedule = async () => {
    try {
      setLoading(true);
      const selectedDateTime = parseISO(`${selectedDate}T${selectedTime}`);
      const isoDateTime = format(selectedDateTime, "yyyy-MM-dd'T'HH:mm:ss");

      const response = await authProvider.post(
        `${API_ADDRESS}reschedule-requests/${recordId}?newDateTime=${encodeURIComponent(
          isoDateTime
        )}`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Успех", "Запрос на перенос отправлен");
      router.back();
    } catch (error) {
      console.error("Ошибка при отправке запроса на перенос:", error);
      Alert.alert("Ошибка", "Не удалось отправить запрос на перенос");
    } finally {
      setLoading(false);
    }
  };

  const markedDates = useMemo(() => {
    const marks = availableDates.reduce((acc: { [key: string]: any }, date) => {
      acc[date] = {
        marked: true,
        dotColor: "#4299e1",
        selected: date === selectedDate,
        selectedColor: "#4299e1",
      };
      return acc;
    }, {});

    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: "#4299e1" };
    }

    return marks;
  }, [availableDates, selectedDate]);

  const handleDayPress = useMemo(
    () =>
      debounce((day: DateData) => {
        if (availableDates.includes(day.dateString)) {
          setSelectedDate((prev) =>
            prev === day.dateString ? "" : day.dateString
          );
          fetchAvailableTimeSlots(day.dateString);
        }
      }, 300),
    [availableDates]
  );

  useEffect(() => {
    fetchAvailableDates();
  }, [recordId]);

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">
        Выберите новую дату и время
      </Text>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        minDate={format(new Date(), "yyyy-MM-dd")}
        firstDay={1}
        theme={{
          todayTextColor: "#4299e1",
          selectedDayBackgroundColor: "#4299e1",
          textDisabledColor: "#d1d5db",
          disabledArrowColor: "#d1d5db",
        }}
      />

      {selectedDate && (
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Выберите время:</Text>
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
        onPress={handleReschedule}
        disabled={!selectedDate || !selectedTime || loading}
      >
        <Text className="text-white text-center text-lg font-semibold">
          {loading ? "Отправка..." : "Запросить перенос"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RescheduleScreen;
