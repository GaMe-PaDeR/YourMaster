import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Button,
  Platform,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Availability from "@/entities/Availability";
import { useEffect } from "react";
import tokenService from "@/services/tokenService";
import { router } from "expo-router";
import authProvider from "@/services/authProvider";
import AvailabilityCalendar from "../appComponents/AvailabilityCalendar";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { SERVICE_CATEGORIES } from "../../constants/categories";
import { ServiceCategory } from "../../constants/categories";
import StandardTimeSelector, {
  TimeSlot,
} from "../appComponents/StandardTimeSelector";

export default function createNewService() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("Haircut");
  const [price, setPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = React.useState<Availability[]>([]);
  const [updatedSelectedDates, setUpdatedSelectedDates] = useState<
    Availability[]
  >([]);
  const [standardTimeSlots, setStandardTimeSlots] = useState<TimeSlot[]>([]);
  const navigation = useNavigation();

  const handleAvailabilityChange = (availabilities: Availability[]) => {
    // console.log("availabilities ", availabilities);
    setSelectedDates(availabilities);
    // console.log("selectedDates ", selectedDates);
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Разрешение необходимо",
        "Пожалуйста, разрешите доступ к фото."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos(result.assets);
    }
  };

  const handleStandardTimeSlotsChange = (slots: TimeSlot[]) => {
    setStandardTimeSlots(slots);
    // Сохраняем выбранные слоты в локальное хранилище
    tokenService.setItem("standardTimeSlots", JSON.stringify(slots));
  };

  // Загружаем сохраненные стандартные слоты при монтировании
  useEffect(() => {
    const loadStandardTimeSlots = async () => {
      const savedSlots = await tokenService.getItem("standardTimeSlots");
      if (savedSlots) {
        setStandardTimeSlots(JSON.parse(savedSlots));
      }
    };
    loadStandardTimeSlots();
  }, []);

  const handleCreateService = async () => {
    try {
      const formData = new FormData();

      const serviceData = {
        title,
        description,
        category,
        price: Number(price),
        estimatedDuration: Number(estimatedDuration),
        availability: selectedDates.map((a) => ({
          date: a.date.toISOString().split(".")[0],
          // Преобразуем Map в массив только выбранных слотов
          timeSlots: Array.from(a.timeSlots.entries())
            .filter(([_, isSelected]) => isSelected)
            .map(([time]) => time)
            .sort((a, b) => a.localeCompare(b)), // Сортируем для консистентности
        })),
        // Используем только выбранные стандартные слоты
        standardTimeSlots: standardTimeSlots
          .filter((slot) => slot.isSelected)
          .map((slot) => slot.time)
          .sort((a, b) => a.localeCompare(b)),
      };

      console.log("Отправляемые данные:", JSON.stringify(serviceData, null, 2));

      formData.append("serviceJson", JSON.stringify(serviceData));

      // Изменяем обработку фотографий
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const filename = photo.uri.split("/").pop() || "photo.jpg";

          formData.append("files", {
            uri:
              Platform.OS === "ios"
                ? photo.uri.replace("file://", "")
                : photo.uri,
            type: "image/jpeg",
            name: filename,
          } as any);
        }
      }

      const response = await authProvider.post(
        `${API_ADDRESS}services/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert("Успех", "Услуга успешно создана");
      router.back();
    } catch (error) {
      console.error("Ошибка при создании услуги:", error);
      Alert.alert(
        "Ошибка",
        "Не удалось создать услугу. Проверьте данные и подключение к интернету."
      );
    }
  };

  useEffect(() => {
    const loadAvailability = async () => {
      const availability = await tokenService.getItem("availability");
      if (availability) {
        setAvailability(JSON.parse(availability));
      }
    };
    loadAvailability();
  }, []);

  useEffect(() => {
    setUpdatedSelectedDates(selectedDates);
  }, [selectedDates]);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Секция основной информации */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Основная информация</Text>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Название услуги</Text>
          <TextInput
            className="w-full h-12 border border-gray-300 rounded-lg px-4"
            placeholder="Введите название"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Описание услуги</Text>
          <TextInput
            className="w-full h-24 border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Опишите вашу услугу"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Категория</Text>
          <View className="border border-gray-300 rounded-lg">
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <Picker.Item
                  key={cat.value}
                  label={cat.label}
                  value={cat.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Секция цены и длительности */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Цена и длительность</Text>

        <View className="flex-1 space-y-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-1">Цена (₽)</Text>
            <TextInput
              className="w-full h-12 border border-gray-300 rounded-lg px-4"
              placeholder="Введите цену"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-1">
              Длительность (мин)
            </Text>
            <TextInput
              className="w-full h-12 border border-gray-300 rounded-lg px-4"
              placeholder="Введите длительность"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Секция фотографий */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Фотографии</Text>

        {/* Контейнер для фотографий */}
        <View className="flex-row flex-wrap">
          {/* Кнопка добавления фото */}
          <TouchableOpacity
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center mb-2 mr-2"
            onPress={handlePickImage}
          >
            <Ionicons name="add" size={32} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 mt-1">Добавить</Text>
          </TouchableOpacity>

          {/* Отображение выбранных фотографий */}
          {photos.map((photo, index) => (
            <View key={index} className="relative mr-2 mb-2">
              <Image
                source={{ uri: photo.uri }}
                className="w-24 h-24 rounded-lg"
              />
              <TouchableOpacity
                className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Подсказка */}
        {/* <Text className="text-sm text-gray-500 mt-2">
          Добавьте до 5 фотографий вашей услуги
        </Text> */}
      </View>

      {/* Секция доступного времени */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Доступное время</Text>
        <AvailabilityCalendar
          onAvailabilityChange={handleAvailabilityChange}
          standardTimeSlots={standardTimeSlots.filter(
            (slot) => slot.isSelected
          )}
        />
      </View>

      {/* Кнопка создания */}
      <TouchableOpacity
        className="w-full h-12 bg-blue-500 rounded-lg justify-center items-center mb-4"
        onPress={handleCreateService}
        disabled={loading}
      >
        <Text className="text-white text-lg">
          {loading ? "Создание..." : "Создать услугу"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
