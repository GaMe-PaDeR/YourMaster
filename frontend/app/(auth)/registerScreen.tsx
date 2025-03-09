import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  View,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { API_ADDRESS } from "@/config";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import tokenService from "@/services/tokenService";
import axios from "axios";

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+7");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");

  const handleRegister = async () => {
    // Проверка на заполнение всех полей
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !role
    ) {
      Alert.alert("Ошибка", "Пожалуйста, заполните все поля.");
      return;
    }

    try {
      const userData = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role: role === "master" ? "ROLE_MASTER" : "ROLE_CLIENT",
      };
      console.log("User Data:", userData);

      const formData = new FormData();
      formData.append("userData", JSON.stringify(userData));
      // formData.append("files", null);

      const response = await axios.post(
        `${API_ADDRESS}auth/sign-up`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        console.log("Registration Success:", response.data);
        Alert.alert("Успех", "Регистрация прошла успешно");
        router.navigate("../(tabs)/home");
      } else {
        console.error("Ошибка при регистрации:", response.statusText);
        Alert.alert("Ошибка", "Не удалось зарегистрироваться");
      }
    } catch (error: any) {
      console.error("Ошибка при регистрации:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: typeof error,
      });
      Alert.alert("Ошибка", "Не удалось зарегистрироваться");
    }
  };

  const pickImage = async () => {
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  };

  const removePhoto = () => {
    // Implementation needed
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-3xl font-semibold mb-2">Создайте аккаунт,</Text>
        <Text className="text-gray-500 mb-6">Пожалуйста, заполните поля:</Text>

        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Имя"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Фамилия"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Электронная почта"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Номер телефона"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => setRole("client")}
            className={`flex-1 h-12 mr-2 rounded-lg justify-center items-center ${
              role === "client" ? "bg-teal-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={role === "client" ? "text-white" : "text-gray-700"}
            >
              Клиент
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole("master")}
            className={`flex-1 h-12 ml-2 rounded-lg justify-center items-center ${
              role === "master" ? "bg-teal-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={role === "master" ? "text-white" : "text-gray-700"}
            >
              Мастер
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-4"
        >
          <Text className="text-white text-lg">Присоединиться сейчас</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate("../(auth)/loginScreen")}
        >
          <Text className="text-center text-gray-700">
            Уже есть аккаунт? <Text className="text-blue-600">Войти</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
