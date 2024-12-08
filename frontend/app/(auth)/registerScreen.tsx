import React, { useEffect, useState } from 'react';
import { SafeAreaView, TextInput, Text, TouchableOpacity, Alert, View } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import LoginScreen from './loginScreen';

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+7');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  // const [loading, setLoading] = useState<boolean>(true);

  const handleRegister = async () => {
    // Проверка на заполнение всех полей
    if (!firstName || !lastName || !email || !phoneNumber || !password || !role) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }
    try {
        const userData = {
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          role: role === 'master' ? 'ROLE_MASTER' : 'ROLE_CLIENT', // Выбор роли
        };
  
        // const formData = new FormData();
        // formData.append('userData', JSON.stringify(userData));
        // formData.append('userData', new Blob(["userData:" + JSON.stringify(userData)], { type: "application/json" }));
        console.log(userData);

        const response = await axios.post('http://192.168.1.2:8080/api/v1/auth/sign-up', userData);
  
        if (response.status === 200) {
          Alert.alert('Успех', 'Регистрация прошла успешно');
          router.navigate("/(tabs)/home");
        }
      } catch (error) {
        console.error("Ошибка при регистрации " + error);
      }
  };
    

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
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
          onPress={() => setRole('client')}
          className={`flex-1 h-12 mr-2 rounded-lg justify-center items-center ${
            role === 'client' ? 'bg-teal-600' : 'bg-gray-200'
          }`}
        >
          <Text className={role === 'client' ? 'text-white' : 'text-gray-700'}>Клиент</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole('master')}
          className={`flex-1 h-12 ml-2 rounded-lg justify-center items-center ${
            role === 'master' ? 'bg-teal-600' : 'bg-gray-200'
          }`}
        >
          <Text className={role === 'master' ? 'text-white' : 'text-gray-700'}>Мастер</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleRegister} className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-4">
        <Text className="text-white text-lg">Присоединиться сейчас</Text>
      </TouchableOpacity>

      {/* <Text className="text-center mb-4">или</Text>

      <TouchableOpacity className="w-full h-12 bg-white border border-gray-300 rounded-lg flex-row justify-center items-center mb-6">
        <Text className="text-gray-700">Присоединиться с помощью VK</Text>
      </TouchableOpacity> */}

      <TouchableOpacity onPress={() => router.navigate("/(auth)/loginScreen")}>
        <Text className="text-center text-gray-700">Уже есть аккаунт? <Text className="text-blue-600">Войти</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default RegisterScreen;
