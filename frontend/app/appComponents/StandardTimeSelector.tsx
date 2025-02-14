import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export interface TimeSlot {
  time: string;
  isSelected: boolean;
}

interface StandardTimeSelectorProps {
  onTimeSlotChange: (selectedSlots: TimeSlot[]) => void;
  initialSlots?: TimeSlot[];
}

const StandardTimeSelector: React.FC<StandardTimeSelectorProps> = ({
  onTimeSlotChange,
  initialSlots,
}) => {
  // Генерируем временные слоты с 7:00 до 22:00 с интервалом 30 минут
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 7;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        slots.push({
          time,
          isSelected: initialSlots?.some((slot) => slot.time === time) || false,
        });
      }
    }
    // console.log("Generated slots:", slots);
    return slots;
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    // console.log("Initial slots received:", initialSlots);
    // Проверяем не только на undefined, но и на пустой массив
    const slots =
      !initialSlots || initialSlots.length === 0
        ? generateTimeSlots()
        : initialSlots;
    // console.log("Using slots:", slots);
    return slots;
  });

  const toggleTimeSlot = (index: number) => {
    // console.log("Toggling slot at index:", index);
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index].isSelected = !newTimeSlots[index].isSelected;
    // console.log("Updated slot:", newTimeSlots[index]);
    setTimeSlots(newTimeSlots);
    onTimeSlotChange(newTimeSlots);
  };

  //   console.log("Rendering with timeSlots:", timeSlots);

  return (
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2">
        Стандартное время для записи
      </Text>
      <Text className="text-sm text-gray-600 mb-2">
        Выберите стандартные временные слоты для записи
      </Text>
      <View className="flex items-center justify-center">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            className="flex-row flex-wrap justify-center"
            style={{ width: 300 }}
          >
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={slot.time}
                onPress={() => toggleTimeSlot(index)}
                className={`m-1 p-2 rounded-lg ${
                  slot.isSelected ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm ${
                    slot.isSelected ? "text-white" : "text-gray-800"
                  }`}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default StandardTimeSelector;
