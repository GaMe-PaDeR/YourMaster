import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import tokenService from "@/services/tokenService";
import { API_ADDRESS } from "@/config";

interface NotificationContextType {
  pushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
  pushToken: null,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setPushToken(token);

      // Отправляем токен на сервер
      try {
        const accessToken = await tokenService.getAccessToken();
        if (accessToken) {
          await fetch(`${API_ADDRESS}notifications/register-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ token }),
          });
        }
      } catch (error) {
        console.error("Failed to register push token:", error);
      }
    };

    registerForPushNotifications();
  }, []);

  return (
    <NotificationContext.Provider value={{ pushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
