import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

const username = 'Test';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Привет, {username}</Text>
      <Text style={styles.subtitle}>Найди услугу, которая тебе необходима</Text>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.promoSlider}>
        <View style={styles.promo}>
          <Image source={require('../../assets/images/slider1.jpg')} style={styles.promoImage} />
          <Text style={styles.promoText}>Haircut</Text>
        </View>
        <View style={styles.promo}>
          <Image source={require('../../assets/images/slider2.jpg')} style={styles.promoImage} />
          <Text style={styles.promoText}>Massage</Text>
        </View>
        <View style={styles.promo}>
          <Image source={require('../../assets/images/slider3.jpg')} style={styles.promoImage} />
          <Text style={styles.promoText}>Cosmetology</Text>
        </View>
      </ScrollView>
    

     
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
      </View>
      <View style={styles.services}>
      <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Massage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Cosmetology</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceButton}>
          <Text style={styles.serviceText}>Spa</Text>
        </TouchableOpacity>
      </View>

     
      <Text style={styles.sectionTitle}>Salon you follow</Text>
     
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
  promoSlider: {
    marginVertical: 20,
    height: 200,
  },
  promoImage: {
    width: 150,
    height: '100%',
    resizeMode: 'cover',
    marginHorizontal: 10,
  },
  promo: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    marginVertical: 10,
  },
});

export default HomeScreen;
