import User from "@/entities/User";

export type RootStackParamList = {
  ChatDetailScreen: {
    chatId: string;
    chatName: string;
    participants: string;
    isGroup: string;
  };
  RecordDetails: { serviceId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 