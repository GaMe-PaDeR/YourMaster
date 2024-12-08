import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { router } from 'expo-router';

const SettingsScreen = () => {
  const [isNotificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isDarkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const handleToggleDarkMode = () => {
    setDarkModeEnabled((prev) => !prev);
  };

  const handleChangePassword = () => {
    Alert.alert('Смена пароля', 'Функционал в разработке.');
  };

  const handleLanguageChange = () => {
    Alert.alert('Смена языка', 'Функционал в разработке.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Настройки</Text>

      {/* Уведомления */}
      <View style={styles.option}>
        <Text style={styles.optionText}>Уведомления</Text>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={handleToggleNotifications}
        />
      </View>

      {/* Темная тема */}
      <View style={styles.option}>
        <Text style={styles.optionText}>Темная тема</Text>
        <Switch
          value={isDarkModeEnabled}
          onValueChange={handleToggleDarkMode}
        />
      </View>

      {/* Смена пароля */}
      <TouchableOpacity style={styles.option} onPress={handleChangePassword}>
        <Text style={styles.optionText}>Сменить пароль</Text>
      </TouchableOpacity>

      {/* Смена языка */}
      <TouchableOpacity style={styles.option} onPress={handleLanguageChange}>
        <Text style={styles.optionText}>Язык</Text>
      </TouchableOpacity>

      {/* Кнопка назад */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Назад</Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  backButton: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SettingsScreen;
