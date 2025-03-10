import { io, Socket } from "socket.io-client";
import tokenService from "../services/tokenService";
import authProvider from "./authProvider";
import { API_ADDRESS } from "@/config";
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import User from "@/entities/User";

let socket: Socket | null = null;

export const initNotificationService = async (): Promise<Socket> => {
  const token = await tokenService.getAccessToken();
  
  socket = io(API_ADDRESS, {
    transports: ['websocket'],
    query: { token }
  });

  return socket;
};

export const subscribeToNotifications = (callback: (message: any) => void) => {
  if (socket) {
    socket.on('newMessage', callback);
  }
};

export const unsubscribeFromNotifications = () => {
  if (socket) {
    socket.off('newMessage');
  }
};

export const sendTestPushNotification = async (token: string) => {
  try {
    const user = await tokenService.getUser();
    console.log("USER ", user)
    if (!user || !user.pushToken) {
      console.log("THERE IS NO PUSHTOKEN")
      throw new Error("Push token not registered");
    }

    const response = await authProvider.post(
      `${API_ADDRESS}notifications/test-push`,
      {
        token: user.pushToken,
        title: "Тестовое уведомление",
        body: "Это тестовое push-уведомление!",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send test push notification:", error);
    throw error;
  }
};

// Настройка уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Получение push-токена
export const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Разрешение на уведомления не предоставлено');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push Token:', token);

    // Отправка токена на сервер
    await sendPushTokenToServer(token);
    return token;
  } catch (error) {
    console.error('Ошибка при получении push-токена:', error);
  }
};

// Отправка токена на сервер
const sendPushTokenToServer = async (token: string) => {
  try {
    const accessToken = await tokenService.getAccessToken();
    if (!accessToken) {
      console.error('Токен доступа отсутствует');
      return;
    }

    const response = await fetch(`${API_ADDRESS}notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Не удалось отправить токен на сервер');
    }

    const userResponse = await authProvider.get(
      `${API_ADDRESS}users/currentUser`
    );
    console.log("userResponse ", userResponse.data);
    await tokenService.saveUser(userResponse.data);
    
    console.log('Push-токен успешно отправлен на сервер');

    console.log("User saved")
  } catch (error) {
    console.error('Ошибка при отправке push-токена на сервер:', error);
  }
};

export const setupNotificationListeners = (router: any) => {
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    if (data?.type === 'chat') {
      router.push(`/(screens)/ChatDetailScreen?chatId=${data.chatId}`);
    } else if (data?.type === 'record') {
      router.push(`/(tabs)/RecordsScreen`);
    }
  });
}; 