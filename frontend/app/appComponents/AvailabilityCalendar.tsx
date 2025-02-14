import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import Availability from "../entities/Availability";
// import { DataProvider } from "../services/createContext";
import tokenService from "../services/tokenService";
import { SafeAreaView } from "react-native-safe-area-context";
import { TimeSlot } from "./StandardTimeSelector";
import DayTimeSlotEditor from "./DayTimeSlotEditor";
import StandardTimeSelector from "./StandardTimeSelector";

interface AvailabilityCalendarProps {
  onAvailabilityChange: (availabilities: Availability[]) => void;
  initialAvailabilities?: Availability[];
  initialStep?: "slots" | "dates" | "edit";
}

const AvailabilityCalendar = ({
  onAvailabilityChange,
  initialAvailabilities = [],
  initialStep = "slots",
}: AvailabilityCalendarProps) => {
  const [step, setStep] = useState<"slots" | "dates" | "edit">(initialStep);
  const [standardTimeSlots, setStandardTimeSlots] = useState<TimeSlot[]>(() => {
    if (initialAvailabilities.length > 0) {
      const allTimeSlots = new Set<string>();
      initialAvailabilities.forEach((av) => {
        av.timeSlots.forEach((_, time) => {
          allTimeSlots.add(time);
        });
      });

      return Array.from(allTimeSlots)
        .sort()
        .map((time) => ({
          time,
          isSelected: true,
        }));
    }
    return [];
  });
  const [availabilities, setAvailabilities] = useState<Availability[]>(
    () => initialAvailabilities
  );
  const [markedDates, setMarkedDates] = useState<Record<string, any>>(() => {
    const marked: Record<string, any> = {};
    initialAvailabilities.forEach((availability) => {
      if (availability.timeSlots.size > 0) {
        const dateString = availability.date.toISOString().split("T")[0];
        marked[dateString] = {
          selected: true,
          selectedColor: "green",
        };
      }
    });
    return marked;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  useEffect(() => {
    console.log("Debug - markedDates:", Object.keys(markedDates).length);
    console.log("Debug - availabilities:", availabilities.length);
  }, [markedDates, availabilities]);

  const handleStandardTimeSlotsChange = (slots: TimeSlot[]) => {
    setStandardTimeSlots(slots);
    console.log("Стандартные тайм-слоты:", slots);
  };

  const handleDeleteDay = () => {
    if (!selectedDate) return;

    const dateString = selectedDate.toISOString().split("T")[0];
    const newMarkedDates = { ...markedDates };
    delete newMarkedDates[dateString];

    const newAvailabilities = availabilities.filter(
      (a) => a.date.toISOString().split("T")[0] !== dateString
    );

    setMarkedDates(newMarkedDates);
    setAvailabilities(newAvailabilities);
    onAvailabilityChange(newAvailabilities);
    setIsEditorVisible(false);
    console.log("Удален день:", dateString);
  };

  // Добавим функцию проверки доступности слота
  const isTimeSlotAvailable = (time: string, date: Date): boolean => {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      const minTime = new Date(now.getTime() + 30 * 60000);
      return slotDate > minTime;
    }
    return true;
  };

  const handleDayPress = (day: { dateString: string }) => {
    if (step === "dates") {
      const newMarkedDates = { ...markedDates };
      const newAvailabilities = [...availabilities];
      const selectedDate = new Date(day.dateString);

      if (markedDates[day.dateString]) {
        // Удаляем дату
        delete newMarkedDates[day.dateString];
        const filteredAvailabilities = availabilities.filter(
          (a) => a.date.toISOString().split("T")[0] !== day.dateString
        );
        setAvailabilities(filteredAvailabilities);
        onAvailabilityChange(filteredAvailabilities);
        console.log("Удален день:", day.dateString);
      } else {
        // Проверяем доступность слотов для выбранного дня
        const availableTimeSlots = new Map(
          standardTimeSlots
            .filter((slot) => slot.isSelected)
            .filter((slot) => isTimeSlotAvailable(slot.time, selectedDate))
            .map((slot) => [slot.time, true])
        );

        if (availableTimeSlots.size === 0) {
          Alert.alert(
            "Внимание",
            "Для выбранного дня нет доступных временных слотов. Выберите другой день."
          );
          return;
        }

        newMarkedDates[day.dateString] = {
          selected: true,
          selectedColor: "green",
        };

        const newAvailability = new Availability(
          selectedDate,
          availableTimeSlots
        );
        newAvailabilities.push(newAvailability);
        setAvailabilities(newAvailabilities);
        onAvailabilityChange(newAvailabilities);
        console.log(
          "Добавлен день:",
          day.dateString,
          "со слотами:",
          Array.from(availableTimeSlots.entries())
        );
      }

      setMarkedDates(newMarkedDates);
    } else if (step === "edit") {
      const date = new Date(day.dateString);
      setSelectedDate(date);
      setIsEditorVisible(true);
    }
  };

  const handleSaveTimeSlots = (timeSlots: Map<string, boolean>) => {
    if (!selectedDate) return;

    const dateString = selectedDate.toISOString().split("T")[0];
    const newAvailabilities = [...availabilities];
    const existingIndex = availabilities.findIndex(
      (a) => a.date.toISOString().split("T")[0] === dateString
    );

    if (timeSlots.size > 0) {
      const newMarkedDates = { ...markedDates };
      newMarkedDates[dateString] = {
        selected: true,
        selectedColor: "green",
      };

      if (existingIndex !== -1) {
        newAvailabilities[existingIndex].timeSlots = timeSlots;
      } else {
        newAvailabilities.push(new Availability(selectedDate, timeSlots));
      }

      setMarkedDates(newMarkedDates);
      setAvailabilities(newAvailabilities);
      onAvailabilityChange(newAvailabilities);
    } else {
      handleDeleteDay();
    }

    setIsEditorVisible(false);
  };

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
          isSelected: false,
        });
      }
    }
    return slots;
  };

  const renderStep = () => {
    switch (step) {
      case "slots":
        return (
          <View>
            <StandardTimeSelector
              onTimeSlotChange={handleStandardTimeSlotsChange}
              initialSlots={standardTimeSlots}
            />
            <TouchableOpacity
              onPress={() => setStep("dates")}
              className="bg-blue-500 p-3 rounded-lg mt-4"
            >
              <Text className="text-white text-center">Далее</Text>
            </TouchableOpacity>
          </View>
        );

      case "dates":
      case "edit":
        return (
          <View>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              minDate={new Date().toISOString().split("T")[0]}
              firstDay={1}
              theme={{
                selectedDayBackgroundColor: "green",
                todayTextColor: "blue",
                arrowColor: "green",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
                textSunday: "#FF0000",
                "stylesheet.calendar.header": {
                  dayTextAtIndex6: { color: "#FF0000" },
                },
              }}
            />
            {step === "dates" && availabilities.length > 0 && (
              <TouchableOpacity
                onPress={() => setStep("edit")}
                className="bg-blue-500 p-3 rounded-lg mt-4"
              >
                <Text className="text-white text-center">
                  Редактировать тайм-слоты
                </Text>
              </TouchableOpacity>
            )}
            {step === "edit" && (
              <Text className="text-sm text-gray-600 mt-4 text-center">
                Нажмите на любой день для редактирования или добавления
                тайм-слотов
              </Text>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-center mb-4">
        {step === "slots"
          ? "Выберите стандартные временные слоты"
          : step === "dates"
          ? "Выберите даты"
          : "Редактирование тайм-слотов"}
      </Text>
      {renderStep()}
      {selectedDate && (
        <DayTimeSlotEditor
          isVisible={isEditorVisible}
          onClose={() => setIsEditorVisible(false)}
          date={selectedDate}
          standardTimeSlots={generateTimeSlots()}
          currentTimeSlots={
            availabilities.find(
              (a) =>
                a.date.toISOString().split("T")[0] ===
                selectedDate.toISOString().split("T")[0]
            )?.timeSlots || new Map()
          }
          onSave={handleSaveTimeSlots}
          onDelete={handleDeleteDay}
        />
      )}
    </SafeAreaView>
  );
};

export default AvailabilityCalendar;
