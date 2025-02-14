import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { TimeSlot } from "./StandardTimeSelector";

interface DayTimeSlotEditorProps {
  isVisible: boolean;
  onClose: () => void;
  date: Date;
  standardTimeSlots: TimeSlot[];
  currentTimeSlots: Map<string, boolean>;
  onSave: (timeSlots: Map<string, boolean>) => void;
  onDelete: () => void;
}

const DayTimeSlotEditor: React.FC<DayTimeSlotEditorProps> = ({
  isVisible,
  onClose,
  date,
  standardTimeSlots,
  currentTimeSlots,
  onSave,
  onDelete,
}) => {
  const [editedTimeSlots, setEditedTimeSlots] = React.useState<
    Map<string, boolean>
  >(new Map());

  // Функция для проверки доступности временного слота
  const isTimeSlotAvailable = (time: string, date: Date): boolean => {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    // Для текущего дня проверяем, не прошло ли время
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      // Добавляем 30 минут к текущему времени как минимальный запас
      const minTime = new Date(now.getTime() + 30 * 60000);
      return slotDate > minTime;
    }

    return true;
  };

  React.useEffect(() => {
    if (isVisible) {
      const newTimeSlots = new Map<string, boolean>();
      standardTimeSlots.forEach((slot) => {
        // Проверяем доступность слота
        if (isTimeSlotAvailable(slot.time, date)) {
          const isSelected = currentTimeSlots.has(slot.time)
            ? currentTimeSlots.get(slot.time)
            : false;
          newTimeSlots.set(slot.time, isSelected);
        }
      });
      setEditedTimeSlots(newTimeSlots);
    }
  }, [isVisible, currentTimeSlots, date]);

  const handleClose = () => {
    setEditedTimeSlots(new Map());
    onClose();
  };

  const toggleTimeSlot = (time: string) => {
    const newTimeSlots = new Map(editedTimeSlots);
    const currentValue = newTimeSlots.get(time);
    newTimeSlots.set(time, !currentValue);
    setEditedTimeSlots(newTimeSlots);
  };

  const handleSave = () => {
    const selectedSlots = new Map<string, boolean>();
    editedTimeSlots.forEach((value, key) => {
      if (value) {
        selectedSlots.set(key, true);
      }
    });
    if (selectedSlots.size === 0) {
      onDelete();
    } else {
      onSave(selectedSlots);
    }
    handleClose();
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-4 rounded-lg w-11/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">
              Редактирование слотов на {date.toLocaleDateString()}
            </Text>
            <TouchableOpacity
              onPress={onDelete}
              className="px-3 py-1 rounded-lg bg-red-500"
            >
              <Text className="text-white">Удалить день</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap justify-center">
            {standardTimeSlots.map((slot) => {
              const isAvailable = isTimeSlotAvailable(slot.time, date);
              const isSelected = editedTimeSlots.get(slot.time);
              const wasSelected = currentTimeSlots.has(slot.time);

              return (
                <TouchableOpacity
                  key={slot.time}
                  onPress={() => isAvailable && toggleTimeSlot(slot.time)}
                  className={`m-1 p-2 rounded-lg ${
                    !isAvailable
                      ? "bg-gray-300"
                      : isSelected
                      ? "bg-blue-500"
                      : wasSelected
                      ? "bg-blue-200"
                      : "bg-gray-200"
                  }`}
                  disabled={!isAvailable}
                >
                  <Text
                    className={`text-sm ${
                      !isAvailable
                        ? "text-gray-500"
                        : isSelected
                        ? "text-white"
                        : wasSelected
                        ? "text-blue-800"
                        : "text-gray-800"
                    }`}
                  >
                    {slot.time}
                    {!isAvailable}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity
              onPress={handleClose}
              className="px-4 py-2 mr-2 rounded-lg bg-gray-200"
            >
              <Text>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-500"
            >
              <Text className="text-white">Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DayTimeSlotEditor;
