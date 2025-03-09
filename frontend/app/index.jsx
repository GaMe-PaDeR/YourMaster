import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const OnboardingSlider = ({ }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const slides = [
    {
      id: 1,
      title: 'Лучший стилист для Вас',
      description: 'Подберем внешний вид, соответствующий Вашему образу жизни',
      image: require('../assets/images/slider2.jpg'),
      button: 'Далее',
    },
    {
      id: 2,
      title: 'Ознакомьтесь с мастерами',
      description: 'Лучшие мастера Вашего города уже размещают услуги тут',
      image: require('../assets/images/slider1.jpg'),
      button: 'Далее',
    },
    {
      id: 3,
      title: 'Найдите лучшего мастера',
      description: 'На выбор представлены услуги множества мастеров, которые подойдут каждому',
      image: require('../assets/images/slider3.jpg'),
      button: 'Начать',
    },
  ];

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / width);
    setActiveSlide(slideIndex);
  };

  const handleNextPress = () => {
    if (activeSlide < slides.length - 1) {
      scrollViewRef.current.scrollTo({ x: (activeSlide + 1) * width, animated: true });
    } else {
      router.replace('./(auth)/loginScreen');
    }
  };
  if (slides) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          ref={scrollViewRef}
          scrollEventThrottle={16}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={slide.image} style={styles.image} />
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
              <TouchableOpacity style={styles.button} onPress={handleNextPress}>
                <Text style={styles.buttonText}>{slide.button}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View key={index+1} style={[styles.dot, activeSlide === index && styles.activeDot]} />
          ))}
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  button: {
    backgroundColor: '#006f78',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#ff8c00',
  },
});

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (refreshToken) {
        router.replace("/(tabs)/home");
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  if (isChecking) return null;
  
  return <OnboardingSlider />;
}
