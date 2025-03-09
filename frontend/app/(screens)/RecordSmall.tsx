import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import Record from "@/entities/Record";
import { UserRole } from "@/entities/Record";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { API_ADDRESS } from "@/config";
import tokenService from "@/services/tokenService";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import authProvider from "@/services/authProvider";

interface RecordSmallProps {
  record: Record;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onMessageMaster: (masterId: string) => void;
  userRole: UserRole;
  onStatusChange: (recordId: string, newStatus: string) => void;
}

const RecordSmall = ({
  record,
  onReschedule,
  onCancel,
  onMessageMaster,
  userRole,
  onStatusChange,
}: RecordSmallProps) => {
  const formattedTime = format(parseISO(record.recordDate), "HH:mm", {
    locale: ru,
  });
  const formattedDate = format(parseISO(record.recordDate), "d MMMM", {
    locale: ru,
  });
  const clientName =
    `${record.client?.firstName} ${record.client?.lastName}` || "Клиент";
  const masterName =
    `${record.master?.firstName} ${record.master?.lastName}` || "Мастер";
  const navigation = useNavigation();

  const recordDate = new Date(record.recordDate);
  const isPastRecord = recordDate < new Date();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "completed" | "cancelled" | null
  >(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      onStatusChange(record.id, newStatus);
    } catch (error) {
      console.error("Ошибка изменения статуса:", error);
      Alert.alert("Ошибка", "Не удалось изменить статус записи");
    }
  };

  const handleCancelRecord = useCallback(async () => {
    if (isCancelling) return;

    Alert.alert(
      "Отмена записи",
      "Вы уверены, что хотите отменить запись?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Да, отменить",
          onPress: async () => {
            setIsCancelling(true);
            try {
              onCancel(record.id);
            } catch (error) {
              console.error("Ошибка отмены записи:", error);
              Alert.alert("Ошибка", "Не удалось отменить запись");
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [isCancelling, record.id, onCancel]);

  const handleMessageMaster = async () => {
    try {
      const recipientId =
        userRole === "ROLE_MASTER" ? record.client.id : record.master.id;
      onMessageMaster(recipientId);
    } catch (error) {
      console.error("Ошибка создания/перехода в чат:", error);
      Alert.alert("Ошибка", "Не удалось начать диалог");
    }
  };

  const handleStatusConfirmation = (action: "completed" | "cancelled") => {
    setSelectedAction(action);
    setShowConfirmation(true);
  };

  const confirmStatusChange = async () => {
    if (selectedAction) {
      await handleStatusChange(selectedAction.toUpperCase());
      setShowConfirmation(false);
      setSelectedAction(null);
    }
  };

  return (
    <View className="bg-white p-5 m-3 mb-3 rounded-xl shadow-lg shadow-black/20">
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-xl font-bold text-slate-800">
          {userRole === "ROLE_MASTER" ? clientName : masterName}
        </Text>
        <View className="items-end">
          <Text className="text-slate-500 text-sm">{formattedDate}</Text>

          {isPastRecord && record.recordStatus === "SCHEDULED" && (
            <View className="mt-2">
              <Text className="text-slate-600 text-sm mb-1">
                Запись состоялась?
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className="items-center bg-green-50 p-1.5 rounded-lg active:bg-green-100"
                  onPress={() => handleStatusConfirmation("completed")}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="items-center bg-red-50 p-1.5 rounded-lg active:bg-red-100"
                  onPress={() => handleStatusConfirmation("cancelled")}
                >
                  <Ionicons name="close-circle" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons
          name="time-outline"
          size={16}
          color="#64748b"
          className="mr-2"
        />
        <Text className="text-slate-600 font-medium">{formattedTime}</Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons
          name="cut-outline"
          size={16}
          color="#64748b"
          className="mr-2"
        />
        <Text className="text-slate-600">{record.service?.title}</Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons
          name="cash-outline"
          size={16}
          color="#64748b"
          className="mr-2"
        />
        <Text className="text-slate-600">{record.service?.price} ₽</Text>
      </View>

      <View className="flex-row items-center mb-4">
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#64748b"
          className="mr-2"
        />
        <Text className="text-slate-600 capitalize">
          {record.recordStatus?.toLowerCase() || "Статус не указан"}
        </Text>
      </View>

      {showConfirmation && (
        <View className="bg-slate-50 p-3 rounded-lg mt-2">
          <Text className="text-slate-600 text-sm mb-2">
            Вы уверены, что хотите отметить запись как{" "}
            {selectedAction === "completed" ? "завершенную" : "отмененную"}?
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="flex-1 items-center bg-green-50 p-2 rounded-lg active:bg-green-100"
              onPress={confirmStatusChange}
            >
              <Text className="text-green-600 text-sm">Да</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center bg-red-50 p-2 rounded-lg active:bg-red-100"
              onPress={() => setShowConfirmation(false)}
            >
              <Text className="text-red-600 text-sm">Нет</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {record.recordStatus === "SCHEDULED" && (
        <View className="mt-2 space-y-2">
          <TouchableOpacity
            className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg active:bg-blue-100"
            onPress={() => onReschedule(record.id)}
          >
            <Ionicons
              name="calendar"
              size={16}
              color="#2563eb"
              className="mr-1"
            />
            <Text className="text-blue-600 text-sm">Перенести запись</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center bg-red-50 px-3 py-2 rounded-lg ${
              isCancelling || record.recordStatus !== "SCHEDULED"
                ? "opacity-50"
                : "active:bg-red-100"
            }`}
            onPress={handleCancelRecord}
            disabled={isCancelling || record.recordStatus !== "SCHEDULED"}
          >
            <Ionicons name="close" size={16} color="#dc2626" className="mr-1" />
            <Text className="text-red-600 text-sm">
              {isCancelling ? "Отмена..." : "Отменить запись"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        className="flex-row items-center bg-purple-50 px-3 py-2 rounded-lg active:bg-purple-100 mt-2"
        onPress={handleMessageMaster}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={16}
          color="#7C3AED"
          className="mr-1"
        />
        <Text className="text-purple-700 text-sm">Написать</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RecordSmall;
