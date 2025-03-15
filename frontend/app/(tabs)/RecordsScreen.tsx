import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Alert,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import RecordSmall from "../(screens)/RecordSmall";
import Record from "@/entities/Record";
import { UserRole } from "@/entities/Record";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { checkExistingChat } from "@/services/chatService";
import authProvider from "@/services/authProvider";

const groupByDate = (records: Record[]) => {
  return records.reduce((acc: { [key: string]: Record[] }, record) => {
    const dateKey = format(parseISO(record.recordDate), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {});
};

const RecordsScreen = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      const response = await authProvider.get(`${API_ADDRESS}records`);
      const { records = [], userRole = UserRole.CLIENT } = response.data as {
        records: Record[];
        userRole: UserRole;
      };
      setRecords(records);
      setUserRole(userRole);
    } catch (error) {
      console.error("Ошибка загрузки записей:", error);
      Alert.alert("Ошибка", "Не удалось загрузить записи");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchRecords();
    }, [fetchRecords])
  );

  const handleReschedule = async (recordId: string) => {
    // Логика переноса записи
  };

  const handleCancel = useCallback(async (recordId: string) => {
    try {
      await authProvider.delete(`${API_ADDRESS}records/${recordId}`);
      setRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== recordId)
      );
      Alert.alert("Успех", "Запись успешно отменена");
    } catch (error) {
      console.error("Ошибка отмены записи:", error);
      Alert.alert("Ошибка", "Не удалось отменить запись");
    }
  }, []);

  const handleStartChat = async (masterId: string) => {
    try {
      const checkResponse = await authProvider.get(
        `${API_ADDRESS}chats/check`,
        {
          params: { recipientId: masterId },
        }
      );

      const chatId = (checkResponse.data as { exists: boolean; chatId: string })
        .exists
        ? (checkResponse.data as { exists: boolean; chatId: string }).chatId
        : (
            await authProvider.post<{ id: string }>(
              `${API_ADDRESS}chats/single`,
              {
                recipientId: masterId,
              }
            )
          ).data.id;

      const masterResponse = await authProvider.get(
        `${API_ADDRESS}users/${masterId}`
      );

      router.push({
        pathname: "../(screens)/ChatDetailScreen",
        params: {
          chatId,
          chatName: `${
            (masterResponse.data as { firstName: string; lastName: string })
              .firstName
          } ${
            (masterResponse.data as { firstName: string; lastName: string })
              .lastName
          }`,
          participants: JSON.stringify([
            masterResponse.data as { firstName: string; lastName: string },
          ]),
          isGroup: "false",
        },
      });
    } catch (error) {
      console.error("Ошибка создания/перехода в чат:", error);
      Alert.alert("Ошибка", "Не удалось начать диалог с мастером");
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      await authProvider.put(`${API_ADDRESS}records/${recordId}/status`, {
        status: newStatus,
      });

      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === recordId ? { ...record, status: newStatus } : record
        )
      );
    } catch (error) {
      console.error("Ошибка изменения статуса:", error);
      Alert.alert("Ошибка", "Не удалось изменить статус записи");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" className="flex-1" />;
  }

  if (records.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-center text-gray-600">
          {userRole === UserRole.CLIENT
            ? "У вас пока нет записей. Найдите мастера и запишитесь на услугу!"
            : "У вас пока нет запланированных записей."}
        </Text>
      </View>
    );
  }

  const groupedRecords = groupByDate(records);
  const sections = Object.entries(groupedRecords).map(([date, items]) => ({
    title: format(parseISO(date), "d MMMM yyyy", { locale: ru }),
    data: items,
  }));

  return (
    <View className="flex-1">
      <View className="flex-row justify-between p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Мои записи</Text>
        <TouchableOpacity
          onPress={() => router.push("../(screens)/RescheduleRequestsScreen")}
          className="bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Запросы на перенос</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <RecordSmall
              record={item}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onMessageMaster={handleStartChat}
              onStatusChange={handleStatusChange}
              userRole={userRole}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-gray px-4 py-2">
            <Text className="text-lg font-semibold">{title}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  recordItem: {
    padding: 10,
  },
  chatButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
});

export default RecordsScreen;
