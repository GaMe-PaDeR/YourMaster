// screens/ChatScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const AppointmentsScreen = ({ navigation }) => {
  const chats = [
    { id: '1', salon: 'Plush Beauty Lounge', message: 'Good morning, anything we can help with?', time: '11:32 PM', unread: 2 },
    { id: '2', salon: 'Lovely Lather', message: 'I would like to book an appointment.', time: 'Yesterday', unread: 1 },
    // Добавьте другие чаты
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ChatDetail', { salon: item.salon })}>
            <View style={styles.chatItem}>
              <Text style={styles.salonName}>{item.salon}</Text>
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  chatItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  salonName: {
    fontWeight: 'bold',
  },
  messageText: {
    color: '#888',
  },
  timeText: {
    color: '#888',
    textAlign: 'right',
  },
});

export default AppointmentsScreen;
