// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hello, User</Text>
      <Text style={styles.subtitle}>Find the service you want, and treat yourself</Text>

      {/* Промо баннер */}
      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>Look more beautiful and save more discount</Text>
        <Text style={styles.promoDiscount}>50% OFF</Text>
      </View>

      {/* Список услуг */}
      <Text style={styles.sectionTitle}>What do you want to do?</Text>
      <View style={styles.services}>
        <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Haircut</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Nails</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Facial</Text>
        </TouchableOpacity>
        {/* Добавьте другие кнопки для услуг */}
      </View>

      {/* Рекомендуемые салоны */}
      <Text style={styles.sectionTitle}>Salon you follow</Text>
      {/* Вставьте карусель с изображениями салонов */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  promoBanner: {
    backgroundColor: '#ff6347',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  promoText: {
    fontSize: 18,
    color: '#fff',
  },
  promoDiscount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  services: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
  },
  serviceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
