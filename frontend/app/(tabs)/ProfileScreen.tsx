import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { router } from 'expo-router';

const ProfileScreen = () => {
  const user = {
    name: 'Анастастия Сергеева',
    email: 'sergeevaNastya@ya.ru',
    avatar: 'https://via.placeholder.com/100',
  };

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', onPress: () => router.navigate('../(auth)/loginScreen') },
    ]);
  };

  const handleEditProfile = () => {
    router.push('../(tabs)/editProfile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Редактировать профиль</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.options}>
        <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/AppointmentsScreen')}>
          <Text style={styles.optionText}>История записей</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={() => router.navigate('/(tabs)/home')}>
          <Text style={styles.optionText}>Настройки</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  options: {
    marginBottom: 24,
  },
  optionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProfileScreen;
