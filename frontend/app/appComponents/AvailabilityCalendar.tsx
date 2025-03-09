import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import Availability from "@/entities/Availability";
import tokenService from "@/services/tokenService";
import { SafeAreaView } from "react-native-safe-area-context";
import { TimeSlot } from "./StandardTimeSelector";
import DayTimeSlotEditor from "./DayTimeSlotEditor";
import StandardTimeSelector from "./StandardTimeSelector";

interface AvailabilityCalendarProps {
  onAvailabilityChange: (availabilities: Availability[]) => void;
  initialAvailabilities?: Availability[];
  initialStep?: "slots" | "dates" | "edit";
  standardTimeSlots?: TimeSlot[];
}

const AvailabilityCalendar = ({
  onAvailabilityChange,
  initialAvailabilities = [],
  initialStep = "slots",
  standardTimeSlots = [],
}: AvailabilityCalendarProps) => {
  const [step, setStep] = useState<"slots" | "dates" | "edit">(initialStep);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  // Мемоизация обработчика изменений
  const stableOnChange = useCallback(
    (newAvailabilities: Availability[]) => {
      onAvailabilityChange(newAvailabilities);
    },
    [onAvailabilityChange]
  );

  // Мемоизация отмеченных дат
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    availabilities.forEach((availability) => {
      const dateString = availability.date.toISOString().split("T")[0];
      // Подсвечиваем дату если есть хотя бы один активный слот
      if (availability.timeSlots.size > 0) {
        marked[dateString] = { selected: true, selectedColor: "green" };
      }
    });
    return marked;
  }, [availabilities]);

  // Обновление только при реальных изменениях
  useEffect(() => {
    stableOnChange(availabilities);
  }, [availabilities, stableOnChange]);

  useEffect(() => {
    console.log(
      "Получены availability:",
      availabilities.map((a) => ({
        date: a.date.toISOString().split("T")[0],
        slots: Array.from(a.timeSlots.entries()),
      }))
    );
  }, [availabilities]);

  useEffect(() => {
    console.log("Обновленные markedDates:", markedDates);
  }, [markedDates]);

  useEffect(() => {
    if (initialAvailabilities.length > 0) {
      setAvailabilities(initialAvailabilities);
    }
  }, [initialAvailabilities]);

  const handleStandardTimeSlotsChange = (slots: TimeSlot[]) => {
    setTimeSlots(slots);
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

    setAvailabilities(newAvailabilities);
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
        console.log("Удален день:", day.dateString);
      } else {
        // Проверяем доступность слотов для выбранного дня
        const availableTimeSlots = new Map(
          timeSlots
            .filter((slot: TimeSlot) => slot.isSelected)
            .map((slot: TimeSlot) => [slot.time, true])
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
        console.log(
          "Добавлен день:",
          day.dateString,
          "со слотами:",
          Array.from(availableTimeSlots.entries())
        );
      }

      setAvailabilities(newAvailabilities);
    } else if (step === "edit") {
      const date = new Date(day.dateString);
      setSelectedDate(date);
      setIsEditorVisible(true);
    }
  };

  const handleSaveTimeSlots = (timeSlots: Map<string, boolean>) => {
    if (!selectedDate) return;

    // Преобразуем Map в объект для логов
    const slotsObject = Object.fromEntries(timeSlots);
    console.log(
      "Сохраненные слоты для",
      selectedDate.toISOString(),
      ":",
      slotsObject
    );

    const dateString = selectedDate.toISOString().split("T")[0];
    const newAvailabilities = [...availabilities];
    const existingIndex = newAvailabilities.findIndex(
      (a) => a.date.toISOString().split("T")[0] === dateString
    );

    // Фильтруем только активные слоты
    const activeSlots = new Map(
      Array.from(timeSlots.entries()).filter(([_, isSelected]) => isSelected)
    );

    if (activeSlots.size === 0) {
      if (existingIndex !== -1) {
        newAvailabilities.splice(existingIndex, 1);
      }
    } else {
      const updatedAvailability = new Availability(selectedDate, activeSlots);

      if (existingIndex !== -1) {
        newAvailabilities[existingIndex] = updatedAvailability;
      } else {
        newAvailabilities.push(updatedAvailability);
      }
    }

    console.log(
      "Обновленные availability после сохранения:",
      newAvailabilities
    );
    setAvailabilities(newAvailabilities);
    onAvailabilityChange(newAvailabilities);
    setIsEditorVisible(false);
  };

  const generateTimeSlots = (timeSlots: Map<string, boolean>): TimeSlot[] => {
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
          isSelected: timeSlots.has(time) ? timeSlots.get(time) : false,
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
              initialSlots={timeSlots}
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
              current={new Date().toISOString().split("T")[0]}
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
          standardTimeSlots={generateTimeSlots(
            availabilities.find(
              (a) =>
                a.date.toISOString().split("T")[0] ===
                selectedDate.toISOString().split("T")[0]
            )?.timeSlots || new Map()
          )}
          currentTimeSlots={
            availabilities.find(
              (a) =>
                a.date.toISOString().split("T")[0] ===
                selectedDate.toISOString().split("T")[0]
            )?.timeSlots || new Map()
          }
          onSave={handleSaveTimeSlots}
          onDelete={handleDeleteDay}
          disabledSlots={Array.from(
            availabilities.find(
              (a) =>
                a.date.toISOString().split("T")[0] ===
                selectedDate.toISOString().split("T")[0]
            )?.timeSlots || new Map()
          )
            .filter(([_, isAvailable]) => !isAvailable)
            .map(([time]) => time)}
        />
      )}
    </SafeAreaView>
  );
};

export default AvailabilityCalendar;
