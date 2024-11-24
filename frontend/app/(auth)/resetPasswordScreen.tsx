// screens/ResetPasswordScreen.js
import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, Text, TouchableOpacity } from 'react-native';

const ResetPasswordScreen = ({  }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-semibold mb-2">New password,</Text>
      <Text className="text-gray-500 mb-6">Now you can create a new password and confirm it below.</Text>

      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
        placeholder="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-6"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity className="w-full h-12 bg-teal-600 rounded-lg justify-center items-center mb-6">
        <Text className="text-white text-lg">Confirm New Password</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
