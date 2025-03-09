import User from "@/entities/User";
import Message from "@/entities/Message"; // Предполагается, что этот тип уже существует

export interface Chat {
  id: string;
  chatName?: string;
  participants: User[];
  messages?: Message[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}