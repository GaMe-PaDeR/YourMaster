// screens/VerifyEmailScreen.js
import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, Text, TouchableOpacity } from 'react-native';

const VerifyEmailScreen = ({ }) => {
  const [otp, setOtp] = useState('');

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-semibold mb-2">Email verification,</Text>
      <Text className="text-gray-500 mb-6">Please type the OTP code that we sent you.</Text>

      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-6"
        placeholder="OTP code"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        autoCapitalize="none"
      />

      <TouchableOpacity className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-6">
        <Text className="text-white text-lg">Verify Email</Text>
      </TouchableOpacity>

      <Text className="text-center text-gray-700">Resend in 02:39</Text>
    </SafeAreaView>
  );
};

export default VerifyEmailScreen;
