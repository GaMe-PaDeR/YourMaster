// screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, Text, TouchableOpacity } from 'react-native';

import { router } from 'expo-router';

const ForgotPasswordScreen = ({ }) => {
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-semibold mb-2">Forgot password,</Text>
      <Text className="text-gray-500 mb-6">Please enter your email below, and we will send you a code to reset your password.</Text>

      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-6"
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-6">
        <Text className="text-white text-lg">Send Code</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.navigate('./loginScreen')}>
        <Text className="text-center text-gray-700">Use phone number instead?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
