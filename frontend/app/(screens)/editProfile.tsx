import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import tokenService from "@/services/tokenService";
import { API_ADDRESS } from "@/config";
import axios from "axios";

export default function EditProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = async () => {
    try {
      await tokenService.makeAuthenticatedRequest(
        {
          method: "put",
          url: `${API_ADDRESS}users/currentUser`,
          data: {
            name,
            email,
            avatar,
            password,
            confirmPassword,
          },
        },
        () => router.push("../(auth)/loginScreen")
      );
      router.push("../(tabs)/ProfileScreen");
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  return (
    <View className="flex-1 px-4 py-6 bg-white rounded-3xl shadow-lg">
      <Image className="w-24 h-24 rounded-full mb-4" source={{ uri: avatar }} />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder="Имя"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder="Avatar URL"
        value={avatar}
        onChangeText={setAvatar}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder="Подтверждение пароля"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="bg-blue-500 rounded-lg px-4 py-2 text-white"
        onPress={handleSave}
      >
        <Text className="text-lg font-semibold">Сохранить</Text>
      </TouchableOpacity>
    </View>
  );
}
