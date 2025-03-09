import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_ADDRESS } from '@/config';
import authProvider from '@/services/authProvider';
import { useRouter } from 'expo-router';

// Настройка обработки уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Запрос разрешений на уведомления
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.error('Push notifications are not supported on emulators');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.error('Failed to get push token for push notification');
    return;
  }

  // Получаем Expo Push Token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Expo Push Token:', token);

  // Отправляем токен на сервер
  try {
    await authProvider.post(`${API_ADDRESS}notifications/register-token`, { token });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
};

// Обработка входящих уведомлений
export const setupNotificationListeners = () => {
  const router = useRouter();

  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    // Обработка нажатия на уведомление
    const data = response.notification.request.content.data;
    if (data?.type === 'chat') {
      router.push(`/(screens)/ChatDetailScreen?chatId=${data.chatId}`);
    } else if (data?.type === 'record') {
      router.push(`/(tabs)/RecordsScreen`);
    }
  });
};

export const sendTestPushNotification = async () => {
  try {
    const response = await authProvider.post(`${API_ADDRESS}notifications/test-push`);
    return response.data;
  } catch (error) {
    console.error('Failed to send test push notification:', error);
    throw error;
  }
}; 