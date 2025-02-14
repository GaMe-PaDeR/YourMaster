import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Record from "../entities/Record";
import { useRouter } from "expo-router";

interface RecordSmallProps {
  record: Record;
}

const RecordSmall: React.FC<RecordSmallProps> = ({ record }) => {
  const router = useRouter();

  const onPress = () => {
    router.push({
      pathname: "/(screens)/RecordDetailsScreen",
      params: { record: JSON.stringify(record) },
    });
  };

  return (
    <TouchableOpacity
      className="bg-white p-4 mb-2 rounded shadow-sm"
      onPress={onPress}
    >
      <Text className="text-lg font-semibold">{record.service.title}</Text>
      <Text className="text-sm text-gray-500">
        Клиент: {record.client.firstName}
      </Text>
      <Text className="text-sm text-gray-500">
        Мастер: {record.master.firstName}
      </Text>
      <Text className="text-sm text-gray-500">
        Статус: {record.record_status}
      </Text>
    </TouchableOpacity>
  );
};

export default RecordSmall;
