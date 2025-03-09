import User from "@/entities/User";

export default interface Message {
  id: string;
  content: string;
  sender: User;
  chatId: string;
  timestamp: Date;
  isRead: boolean;
  replyToMessageId?: string;
}