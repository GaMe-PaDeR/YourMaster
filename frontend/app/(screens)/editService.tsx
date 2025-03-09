import React, { useState, useEffect, useCallback } from "react";
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
import tokenService from "@/services/tokenService";
import authProvider from "@/services/authProvider";
import AvailabilityCalendar from "../appComponents/AvailabilityCalendar";
import * as FileSystem from "expo-file-system";
import { SERVICE_CATEGORIES } from "../../constants/categories";
import Availability from "@/entities/Availability";
import { STATIC_FOLDER } from "@/config";

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
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);

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
        : paramId
        ? String(paramId)
        : "";

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
        () => router.push("../(auth)/loginScreen")
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
      const availabilities = (service.availability || [])
        .map((av: any) => {
          try {
            const timeSlots = new Map<string, boolean>();
            if (av.timeSlots) {
              try {
                const slotsData = JSON.parse(av.timeSlots);
                if (Array.isArray(slotsData)) {
                  slotsData.forEach((time: string) =>
                    timeSlots.set(time, true)
                  );
                } else {
                  Object.entries(slotsData).forEach(([time, isAvailable]) =>
                    timeSlots.set(time, Boolean(isAvailable))
                  );
                }
              } catch (error) {
                console.error("Error parsing timeSlots:", error);
              }
            }

            // Исправляем создание даты
            const availabilityDate = new Date(av.date);
            if (isNaN(availabilityDate.getTime())) {
              console.error("Невалидная дата:", av.date);
              return null;
            }

            // Устанавливаем время в UTC
            const adjustedDate = new Date(
              Date.UTC(
                availabilityDate.getUTCFullYear(),
                availabilityDate.getUTCMonth(),
                availabilityDate.getUTCDate()
              )
            );

            if (adjustedDate < new Date()) {
              console.log(`Дата ${av.date} ранее текущей даты, пропускаем.`);
              return null;
            }

            console.log("Original date from server:", av.date);
            console.log("Adjusted UTC date:", adjustedDate.toISOString());

            return new Availability(adjustedDate, timeSlots);
          } catch (error) {
            console.error("Error parsing timeSlots:", error, av);
            return null;
          }
        })
        .filter(Boolean);

      console.log("Processed availabilities:", availabilities);
      setSelectedDates(availabilities);
      setExistingPhotos(
        (service.photos || []).map(
          (photo: string) => `${API_ADDRESS}files/${photo}`
        )
      );
      console.log("Service data set successfully");

      // После setSelectedDates
      console.log("SelectedDates после обновления:", selectedDates);
      console.log(
        "MarkedDates для календаря:",
        selectedDates.map((a) => a.date.toISOString().split("T")[0])
      );
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert(
          "Ошибка авторизации",
          "Сессия истекла. Пожалуйста, войдите снова."
        );
        router.replace("../(auth)/loginScreen");
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
            `${photoUrl}?folderName=${STATIC_FOLDER}`,
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
              const result = (reader.result as string).replace(
                "application/octet-stream",
                "image/jpeg"
              );
              resolve(result);
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

    if (!imageUrl) {
      return null;
    }

    return (
      <Image
        source={{ uri: imageUrl }}
        className="w-24 h-24 rounded-lg"
        style={{
          resizeMode: "cover",
        }}
        onError={(error) => {
          console.error("Ошибка загрузки изображения:", {
            error: error.nativeEvent,
            url: imageUrl.substring(0, 100) + "...",
          });
        }}
      />
    );
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
        photosToRemove,
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
        () => router.push("./(auth)/loginScreen")
      );

      Alert.alert("Успех", "Услуга успешно обновлена");
      router.back();
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert(
          "Ошибка авторизации",
          "Сессия истекла. Пожалуйста, войдите снова."
        );
        router.replace("./(auth)/loginScreen");
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

  const removeNewPhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPhoto = (photoUrl: string) => {
    setExistingPhotos(existingPhotos.filter((url) => url !== photoUrl));
    setPhotosToRemove([...photosToRemove, photoUrl]);
  };

  const handleAvailabilityChange = useCallback(
    (newAvailabilities: Availability[]) => {
      setSelectedDates((prev) => {
        // Глубокая проверка на изменения
        if (JSON.stringify(prev) === JSON.stringify(newAvailabilities))
          return prev;
        return newAvailabilities;
      });
    },
    []
  );

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
              {existingPhotos.map((photoUrl, index) => (
                <View key={index} className="mr-2 mb-2">
                  <ServiceImage photoUrl={photoUrl} />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    onPress={() => handleRemoveExistingPhoto(photoUrl)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
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
              onAvailabilityChange={(newAvailabilities) => {
                console.log("Получены новые availability:", newAvailabilities);
                setSelectedDates(newAvailabilities);
              }}
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
