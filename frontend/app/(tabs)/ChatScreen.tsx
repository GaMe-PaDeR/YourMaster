import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import tokenService from "@/services/tokenService";
import { API_ADDRESS, WS_ADDRESS } from "@/config";
import { useRouter } from "expo-router";
import io from "socket.io-client";
import User from "@/entities/User";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  role: "ROLE_MASTER" | "ROLE_CLIENT";
  online: boolean;
  lastOnline: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isRead: boolean;
  chatId: string;
}

interface BasicChat {
  id: string;
  chatName?: string;
  participants: Participant[];
  lastMessage?: Message;
  totalMessages: number;
  isGroup: boolean;
}

interface Chat extends BasicChat {
  unreadCount: number;
  chatName?: string | null;
}

const ChatScreen = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserData = async () => {
    const userData = await tokenService.getUser();
    if (userData) {
      setUser({
        ...userData,
        phoneNumber: userData.phoneNumber || "",
        birthday: userData.birthday || new Date(),
        city: userData.city || "",
        country: userData.country || "",
      });
    }
  };

  const fetchChats = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(`${API_ADDRESS}chats/current-user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // console.log(response.data);
      const chatsWithData = response.data.map((chat: Chat) => ({
        ...chat,
        chatName: chat.isGroup ? chat.chatName : null,
        unreadCount: chat.unreadCount || 0,
      }));

      setChats(chatsWithData);
    } catch (error) {
      console.error("Ошибка загрузки чатов:", error);
      Alert.alert("Ошибка", "Не удалось загрузить чаты");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchChats();
    }, [])
  );

  useEffect(() => {
    const setupStompClient = async () => {
      const accessToken = await tokenService.getAccessToken();
      const socket = new SockJS(`${WS_ADDRESS}`);
      const stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        reconnectDelay: 5000,
        debug: (str) => console.log("STOMP:", str),
        onConnect: () => {
          // Подписываемся на новые сообщения
          stompClient.subscribe(`/user/queue/new-messages`, (message) => {
            const newMessage = JSON.parse(message.body);
            if (newMessage.chatId && newMessage.senderId !== user?.id) {
              fetchUnreadMessages();
            }
          });

          // Подписываемся на обновления прочтения
          stompClient.subscribe(`/user/queue/message-read`, (message) => {
            const readMessage = JSON.parse(message.body);
            setChats((prev: Chat[]) =>
              prev.map((chat) => {
                if (chat.id === readMessage.chatId) {
                  const shouldDecrease =
                    chat.lastMessage?.id === readMessage.id &&
                    chat.lastMessage?.senderId !== user?.id;
                  return {
                    ...chat,
                    lastMessage: { ...readMessage, isRead: true },
                    unreadCount: Math.max(
                      chat.unreadCount - (shouldDecrease ? 1 : 0),
                      0
                    ),
                  };
                }
                return chat;
              })
            );
          });
        },
        onStompError: (frame) => {
          console.error("STOMP error:", frame.headers.message);
        },
      });

      stompClient.activate();
      return () => {
        stompClient.deactivate();
      };
    };

    setupStompClient();
  }, []);

  const handlePressChat = async (chat: Chat) => {
    try {
      const accessToken = await tokenService.getAccessToken();

      // Отмечаем последнее сообщение как прочитанное
      if (
        chat.lastMessage &&
        !chat.lastMessage.isRead &&
        chat.lastMessage.senderId !== user?.id
      ) {
        console.log("chat.lastMessage.id", chat.lastMessage.id);
        await axios.put(
          `${API_ADDRESS}messages/${chat.lastMessage.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // Обновляем локальное состояние
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === chat.id && c.lastMessage) {
              return {
                ...c,
                lastMessage: { ...c.lastMessage, isRead: true },
                unreadCount: 0,
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Ошибка отметки сообщения как прочитанного:", error);
    }

    // Переходим к чату
    router.push({
      pathname: "../(screens)/ChatDetailScreen",
      params: {
        chatId: chat.id,
        chatName: chat.chatName,
        participants: JSON.stringify(chat.participants),
        isGroup: chat.isGroup.toString(),
      },
    });
  };

  const renderChatName = (chat: Chat) => {
    // Если это групповой чат и есть название, используем его
    if (chat.isGroup && chat.chatName) {
      return chat.chatName;
    }

    // Для личных чатов находим собеседника
    const interlocutor = chat.participants.find((p) => p.id !== user?.id);
    if (!interlocutor) return "Неизвестный пользователь";

    // Форматируем имя собеседника
    const role = interlocutor.role === "ROLE_MASTER" ? "Мастер" : "Клиент";
    return `${role}: ${interlocutor.firstName} ${interlocutor.lastName}`;
  };

  const renderTimeAgo = (
    timestamp?: string | number | Date | Array<number> | null
  ) => {
    // Если timestamp не определен или null
    if (!timestamp) return "";

    let date: Date;

    // Если timestamp уже является объектом Date
    if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Если timestamp - массив чисел
    else if (Array.isArray(timestamp)) {
      try {
        const [year, month, day, hour, minute, second] = timestamp;
        date = new Date(year, month - 1, day, hour, minute, second);
      } catch (e) {
        console.error("Ошибка парсинга массива времени:", e);
        return "";
      }
    }
    // Если timestamp - строка
    else if (typeof timestamp === "string") {
      // Если строка в формате ISO
      if (timestamp.includes("T")) {
        date = new Date(timestamp);
      }
      // Если строка в формате массива [год, месяц, день, ...]
      else if (timestamp.startsWith("[")) {
        try {
          const [year, month, day, hour, minute, second] =
            JSON.parse(timestamp);
          date = new Date(year, month - 1, day, hour, minute, second);
        } catch (e) {
          console.error("Ошибка парсинга массива времени:", e);
          return "";
        }
      }
      // Если строка - Unix timestamp
      else if (!isNaN(Number(timestamp))) {
        date = new Date(Number(timestamp));
      }
      // Если формат неизвестен
      else {
        console.warn("Неизвестный формат времени:", timestamp);
        return "";
      }
    }
    // Если timestamp - число (Unix timestamp)
    else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    }
    // Если тип данных не поддерживается
    else {
      console.warn(
        "Неподдерживаемый тип данных для времени:",
        typeof timestamp,
        timestamp
      );
      return "";
    }

    // Проверка валидности даты
    if (isNaN(date.getTime())) {
      console.error("Невалидная дата:", timestamp);
      return "";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "только что";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} мин. назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ч. назад`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} д. назад`;
    }
  };

  const renderMessageContent = (message?: Message) => {
    if (!message?.content) return "Нет сообщений";
    return message.content.length > 30
      ? `${message.content.substring(0, 30)}...`
      : message.content;
  };

  const fetchUnreadMessages = async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      const response = await axios.get(`${API_ADDRESS}messages/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // console.log("response", response);
    } catch (error) {
      console.error("Ошибка загрузки непрочитанных сообщений:", error);
    }
  };

  return (
    <View className="flex-1">
      <View className="bg-white p-4 border-b border-gray-200 flex-row justify-between">
        <View className="flex-1">
          <Text className="text-xl font-semibold">Чаты</Text>
        </View>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePressChat(item)}
            className="flex-row p-4 border-b border-gray-200 justify-between items-center"
          >
            <View className="flex-1 mr-2.5">
              <Text className="font-bold text-base">
                {renderChatName(item)}
              </Text>
              <Text className="text-gray-500 mt-1" numberOfLines={1}>
                {renderMessageContent(item.lastMessage)}
              </Text>
            </View>
            <View className="items-end min-w-[70px]">
              <Text className="text-gray-500 text-xs">
                {renderTimeAgo(item.lastMessage?.createdAt)}
              </Text>
              {item.unreadCount > 0 && (
                <View className="bg-red-500 rounded-full px-2 py-1 mt-1">
                  <Text className="text-white text-xs">{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-5">
            Нет активных чатов
          </Text>
        }
      />

      {loading && (
        <ActivityIndicator
          size="large"
          className="absolute top-0 bottom-0 left-0 right-0"
        />
      )}
    </View>
  );
};

export default ChatScreen;
