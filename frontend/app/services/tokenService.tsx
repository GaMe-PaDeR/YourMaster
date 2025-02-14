import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_ADDRESS } from "@/config";
import { router } from "expo-router";

// Определяем тип для callback'а
type UnauthorizedCallback = () => void;

const tokenService = {
  /**
   * @param {string} token
   * @return {Promise<void>}
   */
  async saveAccessToken(token: string) {
    try {
      await AsyncStorage.setItem("accessToken", token);
    } catch (e) {
      console.error("Ошибка при сохранении accessToken:", e);
    }
  },

  /**
   * @return {Promise<string|null>}
   */
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (e) {
      console.error("Ошибка при получении accessToken:", e);
    }
  },

  /**
   * @param {string} token
   * @return {Promise<void>}
   */
  async saveRole(role: string) {
    try {
      await AsyncStorage.setItem("role", role);
    } catch (e) {
      console.error("Ошибка при сохранении role:", e);
    }
  },

  /**
   * @return {Promise<string|null>}
   */
  async getRole() {
    try {
      return await AsyncStorage.getItem("role");
    } catch (e) {
      console.error("Ошибка при получении role:", e);
    }
  },

  /**
   * @param {string} token
   * @return {Promise<void>}
   */
  async saveRefreshToken(token: string) {
    try {
      await AsyncStorage.setItem("refreshToken", token);
    } catch (e) {
      console.error("Ошибка при сохранении refreshToken:", e);
    }
  },

  /**
   * @return {Promise<string|null>}
   */
  async getRefreshToken() {
    try {
      const token = await AsyncStorage.getItem("refreshToken");
      if (token !== null) {
        return token;
      }
    } catch (e) {
      console.error("Ошибка при получении refreshToken:", e);
    }
  },

  /**
   * @return {Promise<void>}
   */
  async logAllKeys() {
    const keys = [...(await AsyncStorage.getAllKeys())];
    console.log("All storage keys:", keys);
  },

  /**
   * @param {string} key
   * @param {string} value
   * @return {Promise<void>}
   */
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error(`Ошибка при сохранении ${key}:`, e);
    }
  },

  /**
   * @param {string} key
   * @return {Promise<string|null>}
   */
  async getItem(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error(`Ошибка при получении ${key}:`, e);
    }
  },

  /**
   * @param {string} key
   * @return {Promise<void>}
   */
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Ошибка при удалении ${key}:`, e);
    }
  },

  /**
   * @param {string[]} keys
   * @return {Promise<string[]>}
   */
  async multiGet(keys: string[]) {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (e) {
      console.error(`Ошибка при получении ${keys}:`, e);
    }
  },

  /**
   * @param {[string, string][]} keysValues
   * @return {Promise<void>}
   */
  async multiSet(keysValues: [string, string][]) {
    try {
      await AsyncStorage.multiSet(keysValues);
    } catch (e) {
      console.error(`Ошибка при сохранении ${keysValues}:`, e);
    }
  },

  /**
   * @param {string[]} keys
   * @return {Promise<void>}
   */
  async multiRemove(keys: string[]) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error(`Ошибка при удалении ${keys}:`, e);
    }
  },

  /**
   * @return {Promise<void>}
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error("Ошибка при очистке хранилища:", e);
    }
  },

  async refreshAccessToken(onUnauthorized?: () => void) {
    try {
      console.log("Starting token refresh...");
      const refreshToken = await this.getRefreshToken();
      console.log("Got refresh token:", refreshToken ? "exists" : "null");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Making refresh request...");
      const response = await axios.post(`${API_ADDRESS}auth/refresh`, {
        refreshToken,
      });
      console.log("Refresh response:", response.data);

      if (response.data.accessToken) {
        console.log("Saving new tokens...");
        await this.saveAccessToken(response.data.accessToken);
        if (response.data.refreshToken) {
          await this.saveRefreshToken(response.data.refreshToken);
        }
        return response.data.accessToken;
      }
      throw new Error("Failed to refresh token");
    } catch (error) {
      console.error("Refresh error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Clearing tokens and redirecting to login...");
        await this.clearTokens();
        onUnauthorized?.();
      }
      throw error;
    }
  },

  async makeAuthenticatedRequest(
    requestConfig: any,
    onUnauthorized: UnauthorizedCallback = () => router.push("/(auth)/login")
  ) {
    try {
      console.log("Making authenticated request:", {
        method: requestConfig.method,
        url: requestConfig.url,
      });

      const accessToken = await this.getAccessToken();
      console.log("Current access token:", accessToken ? "exists" : "null");

      const config = {
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      };

      try {
        return await axios(config);
      } catch (error) {
        console.log("Request failed:", {
          status: error.response?.status,
          data: error.response?.data,
        });

        if (error.response?.status === 401) {
          console.log("Token expired, attempting refresh...");
          try {
            const newToken = await this.refreshAccessToken(onUnauthorized);
            console.log("Got new token, retrying request...");
            config.headers.Authorization = `Bearer ${newToken}`;
            return await axios(config);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            await this.clearTokens();
            onUnauthorized?.();
            throw refreshError;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("Authentication error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    } catch (e) {
      console.error("Ошибка при очистке токенов:", e);
    }
  },
};

export default tokenService;
