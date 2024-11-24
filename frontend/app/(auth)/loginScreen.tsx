import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-root-toast';

import { router } from 'expo-router';
import axios from 'axios';

const LoginScreen = ({ }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleLogin = async () => {
    // Проверка обязательных полей
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, введите email и пароль.');
      return;
    }

    try {
      // Подготовка данных для входа
      const signInDto = {
        email,
        password,
      };

      // Запрос на сервер
      const response = await axios.post('http://192.168.1.8:8080/api/v1/auth/sign-in', signInDto, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Проверка статуса и вывод сообщения об успешном входе
      if (response.status === 200) {
        Alert.alert('Успех', 'Вход выполнен успешно');
        console.log(response);
        // Перенаправление пользователя на основной экран приложения
        router.navigate("/(tabs)/home");
      }
    } catch (error) {
      console.error("Неверный логин или пароль");
      // let toast = Toast.show('Неверный логин или пароль' + error, {
      //   duration: Toast.durations.LONG,
      // });

      // setTimeout(function hideToast() {
      //   Toast.hide(toast);
      // }, 3000);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-semibold mb-2">Приветствуем,</Text>
      <Text className="text-gray-500 mb-6">Рады видеть Вас снова! Пожалуйста, авторизуйтесь.</Text>

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
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={() => router.navigate("/(auth)/forgotPasswordScreen")}>
        <Text className="text-right text-blue-600 mb-6">Забыли пароль?</Text>
      </TouchableOpacity>

      <TouchableOpacity className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-4"
        onPress= {() => handleLogin() }
      >
        <Text className="text-white text-lg">Войти</Text>
      </TouchableOpacity>

      {/* <Text className="text-center mb-4">или</Text>

      <TouchableOpacity className="w-full h-12 bg-white border border-gray-300 rounded-lg flex-row justify-center items-center mb-6">
        <Text className="text-gray-700">Войти с помощью VK</Text>
      </TouchableOpacity> */}

      <TouchableOpacity onPress={() => router.navigate('/(auth)/registerScreen')}>
        <Text className="text-center text-gray-700">Нет аккаунта? <Text className="text-blue-600">Создать</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoginScreen;