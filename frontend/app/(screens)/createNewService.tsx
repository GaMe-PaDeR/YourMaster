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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import * as ImagePicker from "expo-image-picker";
import axios, { AxiosError } from "axios";
import { Alert } from "react-native";
import { FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Availability from "../entities/Availability";
import { useEffect } from "react";
import tokenService from "../services/tokenService";
import { router } from "expo-router";
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

      const response = await tokenService.makeAuthenticatedRequest(
        {
          method: "post",
          url: `${API_ADDRESS}services`,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
        () => router.push("/(auth)/login")
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
    <View className="flex-1 bg-white py-6">
      <FlatList
        className="flex-1 bg-white px-4"
        data={[{ key: "form" }]}
        renderItem={() => (
          <>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Название услуги"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Описание услуги"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <Picker
              selectedValue={category}
              onValueChange={(itemValue: string) =>
                setCategory(itemValue as ServiceCategory)
              }
              mode="dropdown"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <Picker.Item
                  key={cat.value}
                  label={cat.label}
                  value={cat.value}
                />
              ))}
            </Picker>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Цена"
              value={price.toString()}
              onChangeText={(text) => setPrice(text)}
              keyboardType="number-pad"
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Продолжительность (мин)"
              value={estimatedDuration.toString()}
              onChangeText={(text) => setEstimatedDuration(text)}
              keyboardType="number-pad"
            />

            {/* <StandardTimeSelector
              onTimeSlotChange={handleStandardTimeSlotsChange}
              initialSlots={standardTimeSlots}
            /> */}

            <AvailabilityCalendar
              onAvailabilityChange={handleAvailabilityChange}
              standardTimeSlots={standardTimeSlots.filter(
                (slot) => slot.isSelected
              )}
            />

            <View className="flex flex-row items-center mb-4">
              <Button title="Добавить Фото" onPress={handlePickImage} />
              <FlatList
                data={photos}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                  <View className="flex flex-row items-center mr-4">
                    <Image
                      source={{ uri: item.uri }}
                      className="h-24 w-24 rounded-lg mr-2"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setPhotos(
                          photos.filter((photo) => photo.uri !== item.uri)
                        )
                      }
                    >
                      <Ionicons name="close" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
                numColumns={2}
              />
            </View>
            <TouchableOpacity
              className="bg-blue-500 p-2 rounded-lg"
              onPress={handleCreateService}
              disabled={loading}
            >
              <Text className="text-white text-center">Создать</Text>
            </TouchableOpacity>
          </>
        )}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
}
