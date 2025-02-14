import React, { useState } from "react";
import {
  SafeAreaView,
  TextInput,
  Button,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { API_ADDRESS } from "@/config";
import tokenService from "../services/tokenService";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";

import { router } from "expo-router";
import axios from "axios";

const LoginScreen = ({}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    // Проверка обязательных полей
    if (!email || !password) {
      Alert.alert("Ошибка", "Пожалуйста, введите email и пароль.");
      return;
    }

    try {
      // Подготовка данных для входа
      const signInDto = {
        email,
        password,
      };

      // console.log(signInDto);

      // Запрос на сервер
      const response = await axios.post(
        `${API_ADDRESS}auth/sign-in`,
        signInDto,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Проверка статуса и вывод сообщения об успешном входе
      if (response.status === 200) {
        response.data.accessToken
          ? await tokenService.saveAccessToken(response.data.accessToken)
          : null;
        response.data.refreshToken
          ? await tokenService.saveRefreshToken(response.data.refreshToken)
          : null;

        // Получение данных о текущем пользователе
        const userResponse = await axios.get(
          `${API_ADDRESS}users/currentUser`,
          {
            headers: {
              Authorization: `Bearer ${response.data.accessToken}`,
            },
          }
        );

        // Сохранение роли пользователя
        if (userResponse.status === 200) {
          await tokenService.saveRole(userResponse.data.role);
        } else {
          console.error(
            "Ошибка при получении данных о пользователе",
            userResponse.data.message
          );
        }

        // Перенаправление пользователя на основной экран приложения
        router.navigate("/(tabs)/home");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          Alert.alert("Ошибка авторизации", data.message);
        } else {
          console.error("Ошибка при авторизации: ", data.message);
        }
      } else {
        console.error("Произошла неизвестная ошибка", error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-semibold mb-2">Приветствуем,</Text>
      <Text className="text-gray-500 mb-6">
        Рады видеть Вас снова! Пожалуйста, авторизуйтесь.
      </Text>

      <View className="w-full h-12 flex-row items-center border border-gray-300 rounded-lg px-4 mb-4">
        <Mail size={20} color="gray" className="mr-2" />
        <TextInput
          className="flex-1 h-full"
          placeholder="Электронная почта"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {/* <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      /> */}
      <View className="w-full h-12 flex-row items-center border border-gray-300 rounded-lg px-4 mb-4">
        <Lock size={20} color="gray" className="mr-2" />
        <TextInput
          className="flex-1 h-full"
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setPasswordVisible(!isPasswordVisible)}
          className="pl-2"
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color="gray" />
          ) : (
            <Eye size={20} color="gray" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.navigate("/(auth)/forgotPasswordScreen")}
      >
        <Text className="text-right text-blue-600 mb-6">Забыли пароль?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-4"
        onPress={() => handleLogin()}
        // onPress={() => router.navigate("/(tabs)/home")}
      >
        <Text className="text-white text-lg">Войти</Text>
      </TouchableOpacity>

      {/* <Text className="text-center mb-4">или</Text>

      <TouchableOpacity className="w-full h-12 bg-white border border-gray-300 rounded-lg flex-row justify-center items-center mb-6">
        <Text className="text-gray-700">Войти с помощью VK</Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={() => router.navigate("/(auth)/registerScreen")}
      >
        <Text className="text-center text-gray-700">
          Нет аккаунта? <Text className="text-blue-600">Создать</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoginScreen;
