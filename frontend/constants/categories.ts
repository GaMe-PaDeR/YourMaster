export const SERVICE_CATEGORIES = [
  { label: "Стрижка", value: "Haircut" },
  { label: "Маникюр", value: "Nails" },
  { label: "Лицо", value: "Facial" },
  { label: "Окрашивание", value: "Coloring" },
  { label: "Spa", value: "Spa" },
  { label: "Воск", value: "Waxing" },
  { label: "Makeup", value: "Makeup" },
  { label: "Массаж", value: "Massage" },
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]["value"]; 