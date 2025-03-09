import axios from "axios";
import { API_ADDRESS } from "@/config";
import tokenService from "./tokenService";

export const checkExistingChat = async (recipientId: string) => {
  try {
    const accessToken = await tokenService.getAccessToken();
    const response = await axios.get(
      `${API_ADDRESS}chats/check?recipientId=${recipientId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Chat check error:", error);
    return null;
  }
}; 