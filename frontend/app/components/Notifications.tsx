import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const Notifications = () => {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const setupWebSocket = async () => {
        const token = await tokenService.getAccessToken();
        const userId = await tokenService.getUserId();

        const socket = new SockJS(`${API_ADDRESS.replace("http", "ws")}/ws`);
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: { Authorization: `Bearer ${token}` },
          onConnect: () => {
            client.subscribe(
              `/user/${userId}/queue/notifications`,
              (message) => {
                const notification = JSON.parse(message.body);
                setNotifications((prev) => [notification.message, ...prev]);
              }
            );
          },
        });

        client.activate();
        setStompClient(client);
      };

      setupWebSocket();

      return () => {
        if (stompClient) {
          stompClient.deactivate();
        }
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={styles.notification}>
            <Text>{item}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  notification: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Notifications;
