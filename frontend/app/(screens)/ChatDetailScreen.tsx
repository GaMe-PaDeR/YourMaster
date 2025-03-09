import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import axios from "axios";
import { Client, Message } from "@stomp/stompjs";
import tokenService from "@/services/tokenService";
import { API_ADDRESS, WS_ADDRESS } from "@/config";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useLocalSearchParams } from "expo-router";
import SockJS from "sockjs-client";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debounce } from "lodash";
import authProvider from "@/services/authProvider";
// import Message from "../entities/Message";

// Добавьте интерфейс пользователя
interface User {
  id: string;
  // Добавьте другие необходимые поля
  email: string;
  firstName: string;
  lastName: string;
}

// Добавьте интерфейс для участника чата
interface Participant {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Исправьте интерфейс сообщения
interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
  createdAt: Date;
  isRead: boolean;
  isError?: boolean;
}

// Добавим интерфейс для группировки сообщений
interface GroupedMessage {
  type: "date" | "message";
  data: ChatMessage | string;
}

// Оптимизируем компонент сообщения с помощью React.memo и shouldComponentUpdate
const MessageItem = React.memo(
  ({ message, user }: { message: ChatMessage; user: User | null }) => {
    const formatMessageTime = (date: Date) => {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <View
        className={`max-w-[80%] p-3 rounded-xl my-1 ${
          message.sender.id === user?.id
            ? "bg-[#DCF8C6] self-end"
            : "bg-white border border-gray-200 self-start"
        }`}
      >
        <Text className="text-base">{message.content}</Text>
        <View className="flex-row items-center justify-end mt-1">
          {message.isError && (
            <Text className="text-red-500 text-xs mr-1">⚠️</Text>
          )}
          <Text className="text-xs text-gray-500">
            {formatMessageTime(message.createdAt)}
          </Text>
          {message.sender.id === user?.id && (
            <View className="ml-2">
              {message.isRead ? (
                <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#9E9E9E" />
              )}
            </View>
          )}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Проверяем, изменились ли пропсы
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.createdAt.getTime() ===
        nextProps.message.createdAt.getTime() &&
      prevProps.message.isRead === nextProps.message.isRead &&
      prevProps.message.isError === nextProps.message.isError &&
      prevProps.user?.id === nextProps.user?.id
    );
  }
);

const ChatDetailScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    chatId: string;
    chatName?: string;
    participants?: string;
    isGroup?: string;
  }>();

  const chatId = params.chatId;
  const chatName = params.chatName || "Чат";
  const participants = params.participants
    ? (JSON.parse(params.participants) as Participant[])
    : [];
  const isGroup = params.isGroup === "true";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [ackReceived, setAckReceived] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [interlocutor, setInterlocutor] = useState<{
    name: string;
    isOnline: boolean;
    lastSeen: Date;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingInterlocutor, setIsLoadingInterlocutor] = useState(true);
  const listRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [scrollPosition, setScrollPosition] = useState<{
    offset: number;
    contentHeight: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);

  // Исправляем функцию коррекции времени
  const correctTimeZone = (date: Date) => {
    // Получаем смещение в минутах и корректируем знак
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() + timezoneOffset); // Меняем знак на +
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const userData = await tokenService.getUser();
        if (userData) {
          setUser({
            id: userData.id,
            // Добавляем остальные необходимые поля
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });
        } else {
          console.log("userData is null");
          const response = await fetch(`${API_ADDRESS}users/currentUser`);
          const userData = await response.json();
          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
            });
          } else {
            console.log("userData is null");
          }
        }

        // Создаем SockJS соединение
        const socket = new SockJS(`${WS_ADDRESS}`);
        const stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            Authorization: `Bearer ${await tokenService.getAccessToken()}`,
          },
          reconnectDelay: 5000,
          debug: (str) => console.log("STOMP: ", str),
          onConnect: () => {
            setConnectionStatus("connected");
            // stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
            //   try {
            //     const serverMessage = JSON.parse(message.body);

            //     // Проверяем временные сообщения для замены
            //     setMessages((prev) => {
            //       const newMessages = prev.filter(
            //         (msg) =>
            //           !(
            //             msg.id.startsWith("temp-") &&
            //             msg.content === serverMessage.content &&
            //             new Date(msg.createdAt).getTime() ===
            //               new Date(serverMessage.createdAt).getTime()
            //           )
            //       );

            //       const normalizedMessage: ChatMessage = {
            //         id: serverMessage.id,
            //         content: serverMessage.content,
            //         sender: {
            //           id: serverMessage.senderId,
            //           name: serverMessage.senderName,
            //           isOnline: serverMessage.senderIsOnline,
            //           lastSeen: new Date(serverMessage.senderLastSeen),
            //         },
            //         createdAt: correctTimeZone(
            //           new Date(serverMessage.createdAt)
            //         ),
            //         isRead: serverMessage.read ?? false,
            //         isError: false,
            //       };

            //       return [...newMessages, normalizedMessage];
            //     });
            //   } catch (e) {
            //     console.error("Ошибка обработки сообщения:", e);
            //   }
            // });

            stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
              try {
                const serverMessage = JSON.parse(message.body);

                setMessages((prev) => {
                  // Удаляем временные сообщения, совпадающие по контенту
                  const newMessages = prev.filter(
                    (msg) =>
                      !(
                        msg.id.startsWith("temp-") &&
                        msg.content === serverMessage.content
                      )
                  );

                  // Добавляем сообщение от сервера
                  const normalizedMessage: ChatMessage = {
                    id: serverMessage.id,
                    content: serverMessage.content,
                    sender: {
                      id: serverMessage.senderId,
                      name: serverMessage.senderName,
                      isOnline: serverMessage.senderIsOnline,
                      lastSeen: new Date(serverMessage.senderLastSeen),
                    },
                    createdAt: correctTimeZone(
                      new Date(serverMessage.createdAt)
                    ),
                    isRead: serverMessage.read ?? false,
                  };

                  return [...newMessages, normalizedMessage];
                });
              } catch (error) {
                console.error("Ошибка обработки сообщения:", error);
              }
            });

            stompClient.subscribe(
              `/user/queue/message-delivered`,
              (message) => {
                const deliveredMessage = JSON.parse(message.body);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === deliveredMessage.id
                      ? { ...msg, isDelivered: true }
                      : msg
                  )
                );
              }
            );
            stompClient.subscribe(`/user/queue/message-read`, (message) => {
              const readMessage = JSON.parse(message.body);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === readMessage.id ? { ...msg, isRead: true } : msg
                )
              );
            });
            setIsSocketConnected(true);
          },
          onDisconnect: () => {
            setConnectionStatus("error");
          },
          onStompError: (frame) => {
            setConnectionStatus("error");
            console.error("STOMP error:", frame.headers.message);
          },
        });

        stompClient.activate();
        setStompClient(stompClient);

        // Загрузка истории сообщений с корректным временем
        const response = await axios.get(
          `${API_ADDRESS}messages/chat/${chatId}`,
          {
            headers: {
              Authorization: `Bearer ${await tokenService.getAccessToken()}`,
            },
          }
        );

        // Обновляем преобразование даты из серверного формата
        const serverMessages = (
          response.data as { content: any[] }
        ).content.map((msg: any) => {
          const utcDate = new Date(
            Date.UTC(
              msg.createdAt[0],
              msg.createdAt[1] - 1,
              msg.createdAt[2],
              msg.createdAt[3],
              msg.createdAt[4],
              msg.createdAt[5]
            )
          );

          return {
            ...msg,
            createdAt: correctTimeZone(utcDate),
            isRead: msg.read ?? false,
          };
        });

        // После получения сообщений сортируем их
        setMessages(
          serverMessages.sort(
            (a: ChatMessage, b: ChatMessage) =>
              b.createdAt.getTime() - a.createdAt.getTime()
          )
        );
      } catch (error) {
        console.error("Ошибка инициализации чата:", error);
      }
    };

    initChat();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [chatId]);

  useEffect(() => {
    const abortController = new AbortController();

    const loadInterlocutor = async () => {
      try {
        setIsLoadingInterlocutor(true);
        const response = await axios.get(
          `${API_ADDRESS}users/interlocutor/${chatId}`,
          {
            headers: {
              Authorization: `Bearer ${await tokenService.getAccessToken()}`,
            },
            signal: abortController.signal,
          }
        );

        // Добавим проверку на актуальный chatId
        if (!abortController.signal.aborted) {
          setInterlocutor({
            ...response.data,
            name: `${response.data.firstName} ${response.data.lastName}`,
            isOnline: response.data.online,
            lastSeen: response.data.lastOnline
              ? new Date(response.data.lastOnline)
              : new Date(),
          });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Ошибка загрузки данных собеседника:", error);
          setInterlocutor({
            name: "Неизвестный пользователь",
            isOnline: false,
            lastSeen: new Date(),
          });
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingInterlocutor(false);
        }
      }
    };

    if (chatId) {
      loadInterlocutor();
    }

    return () => abortController.abort();
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages.length]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        listRef.current?.scrollToEnd({ animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const loadMessages = async (page: number) => {
    if (isLoading || page >= totalPages) return;

    setIsLoading(true);
    try {
      const response = await authProvider.get(
        `${API_ADDRESS}messages/chat/${chatId}`,
        {
          params: {
            page,
            size: 50,
            sort: "createdAt",
            order: "desc",
          },
        }
      );

      const newMessages = (response.data as { content: any[] }).content.map(
        (msg: any) => {
          const utcDate = new Date(
            Date.UTC(
              msg.createdAt[0],
              msg.createdAt[1] - 1,
              msg.createdAt[2],
              msg.createdAt[3],
              msg.createdAt[4],
              msg.createdAt[5]
            )
          );
          return {
            ...msg,
            createdAt: correctTimeZone(utcDate),
            isRead: msg.read ?? false,
          };
        }
      );

      const uniqueMessages = newMessages.filter(
        (newMsg: ChatMessage) => !messages.some((msg) => msg.id === newMsg.id)
      );

      setMessages((prevMessages) => [...uniqueMessages, ...prevMessages]);
      setTotalPages((response.data as { totalPages: number }).totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Проверяем, что событие и nativeEvent существуют
      if (!event || !event.nativeEvent) {
        console.warn("Scroll event is null or undefined");
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      // Проверяем, что все необходимые свойства существуют
      if (
        contentOffset === undefined ||
        contentSize === undefined ||
        layoutMeasurement === undefined
      ) {
        console.warn("Scroll event properties are undefined");
        return;
      }

      const isNearTop = contentOffset.y <= 100; // Увеличиваем порог для срабатывания

      // Сохраняем текущую позицию скролла
      setScrollOffset(contentOffset.y);
      setIsNearBottom(
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 50
      );

      if (isNearTop && !isLoading && currentPage < totalPages - 1) {
        // Используем setTimeout для задержки загрузки сообщений
        setTimeout(() => {
          loadMessages(currentPage + 1);
        }, 300); // Задержка 300 мс
      }
    },
    [isLoading, currentPage, totalPages]
  );

  useEffect(() => {
    // При монтировании загружаем последние сообщения (последнюю страницу)
    loadMessages(totalPages - 1);
  }, [chatId]);

  const sendMessage = async () => {
    if (isSending || !newMessage.trim() || !user || !stompClient?.connected)
      return;
    setIsSending(true);

    // Создание временного сообщения
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: newMessage,
      sender: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        isOnline: true,
        lastSeen: new Date(),
      },
      createdAt: new Date(),
      isRead: false,
      isError: false,
    };

    // Добавление временного сообщения в состояние
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Отправка через WebSocket
      stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify({
          chatId: chatId,
          userId: user.id,
          content: newMessage,
        }),
        headers: {
          Authorization: `Bearer ${await tokenService.getAccessToken()}`,
        },
      });

      setNewMessage("");
    } catch (error) {
      console.error("Ошибка отправки:", error);

      // Пометка временного сообщения как ошибочного
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, isError: true } : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // Функция для группировки сообщений по датам
  const groupMessagesByDate = (messages: ChatMessage[]): GroupedMessage[] => {
    const grouped: GroupedMessage[] = [];
    let lastDate = "";

    // Сортируем сообщения по возрастанию даты
    const sortedMessages = messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    sortedMessages.forEach((msg) => {
      // Проверяем, существует ли msg.createdAt
      if (!msg.createdAt) {
        console.error("Message createdAt is undefined:", msg);
        return;
      }

      let msgDate: Date;

      // Если createdAt — это массив, преобразуем его в объект Date
      if (Array.isArray(msg.createdAt)) {
        const [year, month, day, hour, minute, second, millisecond] =
          msg.createdAt;
        msgDate = new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second,
          millisecond
        );
      } else if (msg.createdAt instanceof Date) {
        // Если это уже объект Date, используем его
        msgDate = msg.createdAt;
      } else {
        // Если это строка, преобразуем в объект Date
        msgDate = new Date(msg.createdAt);
      }

      // Проверяем, что msgDate является корректной датой
      if (isNaN(msgDate.getTime())) {
        console.error("Invalid date:", msg.createdAt);
        return;
      }

      const currentDate = msgDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (currentDate !== lastDate) {
        grouped.push({
          type: "date",
          data: currentDate,
        });
        lastDate = currentDate;
      }

      grouped.push({
        type: "message",
        data: {
          ...msg,
          createdAt: msgDate, // Обновляем createdAt на объект Date
        },
      });
    });

    return grouped;
  };

  // Обновленная функция форматирования времени
  const formatMessageTime = (date: Date) => {
    try {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Обновленная функция статуса "был(а) в сети"
  const formatLastSeen = (date: Date) => {
    const correctedDate = correctTimeZone(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - correctedDate.getTime()) / 1000);

    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return correctedDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Эффект для восстановления позиции
  useEffect(() => {
    if (listRef.current) {
      if (isNearBottom) {
        listRef.current.scrollToEnd({ animated: false });
      } else {
        listRef.current.scrollToOffset({
          offset: scrollOffset,
          animated: false,
        });
      }
    }
  }, [messages]);

  // Сохраняем позицию при уходе с экрана
  useEffect(() => {
    return () => {
      if (listRef.current) {
        listRef.current.scrollToOffset({
          offset: scrollOffset,
          animated: false,
        });
        // Сохраняем в AsyncStorage или контексте
        AsyncStorage.setItem(
          `chatScroll_${chatId}`,
          JSON.stringify({
            offset: scrollOffset,
            contentHeight: scrollOffset + 50,
          })
        );
      }
    };
  }, [chatId]);

  // Восстанавливаем при монтировании
  useEffect(() => {
    const loadPosition = async () => {
      const saved = await AsyncStorage.getItem(`chatScroll_${chatId}`);
      if (saved) {
        const { offset, contentHeight } = JSON.parse(saved);
        setScrollPosition({ offset, contentHeight });
      }
    };
    loadPosition();
  }, [chatId]);

  // Применяем сохраненную позицию
  useEffect(() => {
    if (scrollPosition && listRef.current) {
      listRef.current.scrollToOffset({
        offset: scrollPosition.offset,
        animated: false,
      });
    }
  }, [scrollPosition]);

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Заголовок чата */}
      <View className="bg-white p-4 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>

        <View className="flex-1 ml-4">
          {isLoadingInterlocutor ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <>
              <Text className="text-xl font-semibold">
                {interlocutor?.name}
              </Text>
              <View className="flex-row items-center mt-1">
                {interlocutor?.isOnline !== undefined && (
                  <>
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${
                        interlocutor.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <Text className="text-sm text-gray-500">
                      {interlocutor.isOnline
                        ? "В сети"
                        : `Был(а) в сети ${formatLastSeen(
                            interlocutor.lastSeen
                          )}`}
                    </Text>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Список сообщений */}
      <FlatList
        ref={listRef}
        data={groupMessagesByDate(messages)}
        keyExtractor={(item, index) => {
          if (item.type === "date") return `date-${item.data}`;
          const msg = item.data as ChatMessage;
          return `msg-${msg.id}-${
            msg.createdAt?.getTime() || Date.now()
          }-${index}`;
        }}
        renderItem={({ item }) => {
          if (item.type === "date") {
            return (
              <View className="bg-gray-100 p-2 rounded-full self-center my-2">
                <Text className="text-gray-600 text-sm">
                  {item.data as string}
                </Text>
              </View>
            );
          }

          const message = item.data as ChatMessage;
          return <MessageItem message={message} user={user} />;
        }}
        onContentSizeChange={() => {
          // Прокручиваем вниз только если пользователь находится внизу
          if (isNearBottom) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          // Прокручиваем вниз только если пользователь находится внизу
          if (isNearBottom) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onScrollToIndexFailed={() => {
          // Прокручиваем вниз только если пользователь находится внизу
          if (isNearBottom) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onScroll={handleScroll}
        scrollEventThrottle={200} // Увеличиваем интервал обработки событий
        className="flex-1"
      />

      {/* Поле ввода */}
      <View className="bg-white p-2 border-t border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <TextInput
            className="flex-1 max-h-40"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Напишите сообщение..."
            multiline
            style={{
              maxHeight: 80,
              height: Math.min(Math.max(inputHeight, 40), 80),
              fontSize: 16,
            }}
            onContentSizeChange={handleContentSizeChange}
            scrollEnabled={true}
          />
          <TouchableOpacity
            onPress={sendMessage}
            className="ml-2 p-2 bg-blue-500 rounded-full"
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatDetailScreen;
