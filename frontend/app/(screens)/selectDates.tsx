import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AvailabilityCalendar from "../appComponents/AvailabilityCalendar";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";
import tokenService from "../services/tokenService";
import { useLocalSearchParams } from "expo-router";
import Availability from "../entities/Availability";

export default function SelectDatesScreen() {
  const [selectedDates, setSelectedDates] = React.useState<Availability[]>([]);
  const navigation = useNavigation();
  const { dates } = useLocalSearchParams();
  // console.log("DATES 1 " + dates);

  React.useEffect(() => {
    const loadAvailability = async () => {
      const availability = await tokenService.getItem("availability");
      if (availability) {
        setSelectedDates(JSON.parse(availability as string));
      }
      handleAvailabilityChange(JSON.parse(availability as string));
    };
    loadAvailability();
  }, [dates]);

  const handleAvailabilityChange = (availabilities: Availability[]) => {
    setSelectedDates(
      availabilities
        .map((a) => a.date.toISOString().split("T")[0])
        .map((dateString) => new Availability(new Date(dateString), true))
    );
    console.log(selectedDates);
  };

  return (
    <View className="flex-1 bg-gray-100 px-6 py-4">
      <Text className="text-3xl font-bold text-center mb-6">
        Выберите доступные даты
      </Text>

      <AvailabilityCalendar onAvailabilityChange={handleAvailabilityChange} />
      <TouchableOpacity
        className="mt-auto py-4 px-6 bg-blue-500 rounded-lg"
        onPress={() => {
          router.navigate({
            pathname: "/(screens)/createNewService",
            params: {
              dates: JSON.stringify(dates),
            },
          });
        }}
      >
        <Text className="text-white">Принять</Text>
      </TouchableOpacity>
    </View>
  );
}
