import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Button,
  Alert,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API_ADDRESS } from "@/config";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import tokenService from "../services/tokenService";
import AvailabilityCalendar from "../appComponents/AvailabilityCalendar";
import * as FileSystem from "expo-file-system";
import { SERVICE_CATEGORIES } from "../../constants/categories";
import Availability from "../entities/Availability";

export default function EditService() {
  const params = useLocalSearchParams();
  const [serviceId, setServiceId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedDates, setSelectedDates] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  // Обрабатываем параметры когда они станут доступны
  useEffect(() => {
    console.log("Params changed:", params);
    // Проверяем оба возможных параметра
    const paramId = params.serviceId || params.id;
    if (!paramId) {
      console.log("No id in params");
      return;
    }

    const id =
      typeof paramId === "string"
        ? paramId
        : Array.isArray(paramId)
        ? paramId[0]
        : paramId.toString();

    console.log("Parsed id:", id);

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      console.error("Невалидный id:", id);
      Alert.alert("Ошибка", "Некорректный идентификатор услуги");
      router.back();
      return;
    }

    console.log("Setting valid id:", id);
    setServiceId(id);
  }, [params.serviceId, params.id]); // Следим за обоими параметрами

  // Загружаем данные только когда serviceId валиден
  useEffect(() => {
    console.log("ServiceId changed:", serviceId);
    if (!serviceId) {
      console.log("No serviceId yet");
      return;
    }

    console.log("Starting to fetch service details for ID:", serviceId);
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      console.log("Fetching service details...");

      const response = await tokenService.makeAuthenticatedRequest(
        {
          method: "get",
          url: `${API_ADDRESS}services/${serviceId}`,
        },
        () => router.push("/(auth)/login")
      );

      console.log("Got response:", response.data);

      const service = response.data;
      if (!service) {
        console.error("Service data is empty");
        Alert.alert("Ошибка", "Услуга не найдена");
        router.back();
        return;
      }

      console.log("Setting service data...");
      setTitle(service.title);
      setDescription(service.description);
      setCategory(service.category);
      setPrice(service.price.toString());
      setEstimatedDuration(service.estimatedDuration.toString());

      // Преобразуем полученные данные в формат Availability
      const availabilities = (service.availability || []).map((av: any) => {
        try {
          // Парсим JSON строку в объект
          const timeSlotsObj = av.timeSlots ? JSON.parse(av.timeSlots) : {};
          const timeSlots = new Map<string, boolean>();

          // Преобразуем объект в Map
          Object.entries(timeSlotsObj).forEach(([time, isBooked]) => {
            timeSlots.set(time, Boolean(isBooked));
          });

          console.log(
            `Parsed timeSlots for date ${av.date}:`,
            Array.from(timeSlots.entries())
          );

          // Создаем новый экземпляр Availability
          return new Availability(new Date(av.date), timeSlots);
        } catch (error) {
          console.error("Error parsing timeSlots:", error, av);
          // Возвращаем пустую доступность при ошибке
          return new Availability(new Date(av.date), new Map());
        }
      });

      console.log("Processed availabilities:", availabilities);
      setSelectedDates(availabilities);
      setExistingPhotos(
        (service.photos || []).map((photo) => `${API_ADDRESS}files/${photo}`)
      );
      console.log("Service data set successfully");
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert(
          "Ошибка авторизации",
          "Сессия истекла. Пожалуйста, войдите снова."
        );
        router.replace("/login");
        return;
      }

      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      Alert.alert(
        "Ошибка",
        "Не удалось загрузить данные услуги. Проверьте подключение к интернету."
      );
      router.back();
    }
  };

  const handleUpdateService = async () => {
    if (!serviceId) {
      Alert.alert("Ошибка", "Идентификатор услуги не найден");
      return;
    }

    try {
      const formData = new FormData();

      const serviceData = {
        id: serviceId,
        title,
        description,
        category,
        price: Number(price),
        estimatedDuration: Number(estimatedDuration),
        availability: selectedDates.map((a) => ({
          date: a.date.toISOString().split(".")[0],
          timeSlots: Array.from(a.timeSlots.entries())
            .filter(([_, isSelected]) => isSelected)
            .map(([time]) => time)
            .sort((a, b) => a.localeCompare(b)),
        })),
      };

      formData.append("serviceJson", JSON.stringify(serviceData));

      if (photos.length > 0) {
        for (const photo of photos) {
          const fileContent = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const blob = await fetch(
            `data:${photo.type || "image/jpeg"};base64,${fileContent}`
          ).then((r) => r.blob());
          formData.append("files", blob, "photo.jpg");
        }
      }

      await tokenService.makeAuthenticatedRequest(
        {
          method: "put",
          url: `${API_ADDRESS}services/${serviceId}`,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
        () => router.push("/(auth)/login")
      );

      Alert.alert("Успех", "Услуга успешно обновлена");
      router.back();
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert(
          "Ошибка авторизации",
          "Сессия истекла. Пожалуйста, войдите снова."
        );
        router.replace("/login");
        return;
      }

      console.error("Ошибка при обновлении услуги:", error);
      Alert.alert("Ошибка", "Не удалось обновить услугу");
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const removeExistingPhoto = async (photoUrl: string) => {
    try {
      await tokenService.makeAuthenticatedRequest(
        {
          method: "delete",
          url: `${API_ADDRESS}services/${serviceId}/photos`,
          data: { photoUrl },
        },
        () => router.push("/(auth)/login")
      );
      setExistingPhotos(existingPhotos.filter((photo) => photo !== photoUrl));
      Alert.alert("Успех", "Фото успешно удалено");
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert(
          "Ошибка авторизации",
          "Сессия истекла. Пожалуйста, войдите снова."
        );
        return;
      }
      console.error("Ошибка при удалении фото:", error);
      Alert.alert("Ошибка", "Не удалось удалить фото");
    }
  };

  const removeNewPhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-white py-6">
      <FlatList
        className="flex-1 bg-white px-4"
        data={[{ key: "form" }]}
        renderItem={() => (
          <>
            <Text className="text-lg font-bold mb-2">Название услуги</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              value={title}
              onChangeText={setTitle}
              placeholder="Введите название услуги"
            />

            <Text className="text-lg font-bold mb-2">Описание</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Введите описание услуги"
            />

            <Text className="text-lg font-bold mb-2">Категория</Text>
            <View className="border border-gray-300 rounded-lg mb-4">
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                mode="dropdown"
              >
                <Picker.Item label="Выберите категорию" value="" />
                {SERVICE_CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                  />
                ))}
              </Picker>
            </View>

            <Text className="text-lg font-bold mb-2">Цена (₽)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="Введите цену"
            />

            <Text className="text-lg font-bold mb-2">
              Длительность (в минутах)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="numeric"
              placeholder="Введите длительность"
            />

            <Text className="text-lg font-bold mb-2">Существующие фото</Text>
            <View className="flex-row flex-wrap mb-4">
              {existingPhotos.map((photo, index) => (
                <View key={index} className="mr-2 mb-2">
                  <Image
                    source={{ uri: photo }}
                    className="w-24 h-24 rounded-lg"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    onPress={() => removeExistingPhoto(photo)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text className="text-lg font-bold mb-2">Новые фото</Text>
            <View className="flex-row flex-wrap mb-4">
              {photos.map((photo, index) => (
                <View key={index} className="mr-2 mb-2">
                  <Image
                    source={{ uri: photo.uri }}
                    className="w-24 h-24 rounded-lg"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    onPress={() => removeNewPhoto(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
                onPress={handlePickImage}
              >
                <Ionicons name="add" size={32} color="gray" />
              </TouchableOpacity>
            </View>

            <Text className="text-lg font-bold mb-2">Доступное время</Text>
            <AvailabilityCalendar
              onAvailabilityChange={setSelectedDates}
              initialAvailabilities={selectedDates}
              initialStep="edit"
            />

            <TouchableOpacity
              className="bg-blue-500 p-2 rounded-lg mt-4 mb-8"
              onPress={handleUpdateService}
              disabled={loading}
            >
              <Text className="text-white text-center">
                {loading ? "Сохранение..." : "Сохранить изменения"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      />
    </View>
  );
}
