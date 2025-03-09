import React, { useState, useEffect, useMemo } from "react";
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
import { API_ADDRESS, STATIC_FOLDER } from "@/config";
import tokenService from "@/services/tokenService";
import { Calendar, DateData } from "react-native-calendars";
import Service from "@/entities/Service";
import { format, parseISO, formatISO } from "date-fns";
import { debounce } from "lodash";
import { checkExistingChat } from "@/services/chatService";
import authProvider from "@/services/authProvider";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingRequest {
  serviceId: string;
  date: string;
  time: string;
  masterId: string;
}

const MemoizedDay = React.memo(
  ({
    date,
    state,
    markedDates,
    selectedDate,
    onPress,
  }: {
    date: DateData;
    state: string;
    markedDates: { [key: string]: any };
    selectedDate: string;
    onPress: (dateString: string) => void;
  }) => {
    console.log(`[PERF] Rendering day: ${date.dateString}`);

    return (
      <TouchableOpacity
        style={{
          backgroundColor: markedDates[date.dateString]?.marked
            ? "#f0f9ff"
            : "transparent",
          borderRadius: 8,
          padding: 8,
          opacity: state === "disabled" ? 0.5 : 1,
        }}
        onPress={() => onPress(date.dateString)}
        disabled={!markedDates[date.dateString]?.marked}
      >
        <Text
          style={{
            color: state === "disabled" ? "#d1d5db" : "#1e40af",
            fontWeight: date.dateString === selectedDate ? "bold" : "normal",
          }}
        >
          {date.day}
        </Text>
      </TouchableOpacity>
    );
  }
);

const ServiceImage = ({ photoUrl }: { photoUrl: string }) => {
  const [imageUrl, setImageUrl] = useState<string>("");

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
      } catch (error) {
        console.error("Ошибка при настройке изображения:", error);
      }
    };

    setupImage();
  }, [photoUrl]);

  if (!imageUrl) return null;

  return (
    <Image
      source={{ uri: imageUrl }}
      className="w-full h-48 rounded-lg mb-4"
      onError={(error) => {
        console.error("Ошибка загрузки изображения:", {
          error: error.nativeEvent,
          url: imageUrl.substring(0, 100) + "...",
        });
      }}
    />
  );
};

export default function BookService() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentMarks, setCurrentMarks] = useState<{ [key: string]: any }>({});
  const [datesLoading, setDatesLoading] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const accessToken = await tokenService.getAccessToken();
        const response = await axios.get<string[]>(
          `${API_ADDRESS}services/${id}/available-dates`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        setAvailableDates(response.data);
      } catch (error) {
        console.error("Ошибка загрузки дат:", error);
      }
    };

    if (id) fetchAvailableDates();
  }, [id]);

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
      console.log("Загрузка слотов для даты:", selectedDate);
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(
        `${API_ADDRESS}services/${id}/available-slots`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { date: selectedDate },
        }
      );

      console.log("Ответ слотов времени:", response.data);
      setAvailableTimeSlots(response.data);
    } catch (error) {
      console.error("Ошибка загрузки слотов:", error);
    }
  };

  const handleBooking = async () => {
    try {
      const selectedDateTime = parseISO(`${selectedDate}T${selectedTime}`);
      const isoDateTime = format(selectedDateTime, "yyyy-MM-dd'T'HH:mm:ss");

      const response = await authProvider.post(`${API_ADDRESS}records/create`, {
        serviceId: id,
        recordDate: isoDateTime,
        recipientId: service?.master.id,
      });

      if (response.status === 200) {
        Alert.alert("Успех", "Запись успешно создана", [
          {
            text: "OK",
            onPress: () => router.navigate("/(tabs)/RecordsScreen"),
          },
        ]);
        fetchAvailableTimeSlots();

        // const existingChatId = await checkExistingChat(
        //   service?.master.id || ""
        // );
        // if (existingChatId) {
        //   router.push(`../(screens)/ChatDetailScreen?chatId=${existingChatId}`);
        // } else {
        //   await authProvider.post(`${API_ADDRESS}chats/single`, {
        //     recipientId: service?.master.id || "",
        //   });
        // }
      }
    } catch (error) {
      let errorMessage = "Не удалось создать запись";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      Alert.alert("Ошибка", errorMessage);
    }
  };

  const checkExistingChat = async (recipientId: string) => {
    try {
      const response = await authProvider.get(`${API_ADDRESS}chats/check`, {
        params: { recipientId },
      });
      return (response.data as { exists: boolean; chatId: string }).exists
        ? (response.data as { exists: boolean; chatId: string }).chatId
        : null;
    } catch (error) {
      console.error("Ошибка проверки чата:", error);
      return null;
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
        }
      }, 300),
    [availableDates]
  );

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
          <ServiceImage photoUrl={service.photos[0]} />
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
        {datesLoading ? (
          <ActivityIndicator size="small" color="#4299e1" />
        ) : (
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            minDate={format(new Date(), "yyyy-MM-dd")}
            theme={{
              todayTextColor: "#4299e1",
              selectedDayBackgroundColor: "#4299e1",
              textDisabledColor: "#d1d5db",
              disabledArrowColor: "#d1d5db",
            }}
            dayComponent={({
              date,
              state,
            }: {
              date: DateData;
              state: string;
            }) => (
              <MemoizedDay
                date={date}
                state={state}
                markedDates={markedDates}
                selectedDate={selectedDate}
                onPress={setSelectedDate}
              />
            )}
            onVisibleMonthsChange={(
              months: { month: number; year: number }[]
            ) => {
              console.log("Отображаемые месяцы:", months);
            }}
            onMonthChange={(month: { month: number; year: number }[]) => {
              console.log("Изменен месяц:", month);
            }}
          />
        )}

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
