import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const AppointmentsScreen = () => {
  const router = useRouter();

  const appointments = [
    {
      id: '1',
      service: 'Стрижка',
      salon: 'Парикмахер Екатерина',
      date: '30.12.2024',
      time: '14:00',
      status: 'upcoming',
    },
    {
      id: '2',
      service: 'Маникюр',
      salon: 'Мастер ногтевого сервиса Елена',
      date: '10.09.2024',
      time: '11:00',
      status: 'past',
    },
  ];

  const handleCancelAppointment = (id) => {
    Alert.alert('Отмена записи', 'Вы уверены, что хотите отменить запись?', [
      { text: 'Нет', style: 'cancel' },
      { text: 'Да', onPress: () => console.log(`Appointment ${id} canceled`) },
    ]);
  };

  const renderAppointment = ({ item }) => (
    <View style={[styles.appointmentItem, item.status === 'past' && styles.pastAppointment]}>
      <View>
        <Text style={styles.service}>{item.service}</Text>
        <Text style={styles.salon}>{item.salon}</Text>
        <Text style={styles.dateTime}>
          {item.date} в {item.time}
        </Text>
      </View>
      {item.status === 'upcoming' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelAppointment(item.id)}
        >
          <Text style={styles.cancelButtonText}>Отменить</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Мои записи</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        ListEmptyComponent={<Text style={styles.emptyText}>У вас пока нет записей.</Text>}
      />
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
    marginBottom: 16,
    textAlign: 'center',
  },
  appointmentItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastAppointment: {
    backgroundColor: '#f0f0f0',
  },
  service: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  salon: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
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

export default AppointmentsScreen;
