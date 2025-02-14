import Service from "@/app/entities/Service";
import { FlatList, View, Text, TouchableOpacity } from "react-native";
import tokenService from "@/app/services/tokenService";
import { router } from "expo-router";

const ServiceList = ({ services }: { services: Service[] }) => {
  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="m-4">
          <TouchableOpacity
            key={"button_" + item.id}
            className="flex flex-row items-center rounded-lg bg-white p-4"
            onPress={async () => {
              await tokenService.setItem("service", JSON.stringify(item));
              router.push("/(screens)/RecordDetailsScreen");
            }}
          >
            <View key={"view_" + item.id} className="flex-1 ml-4">
              <Text className="font-bold text-lg">{item.title}</Text>
              <Text className="text-sm">{item.description}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

export default ServiceList;
