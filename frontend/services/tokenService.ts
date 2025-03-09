import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { API_ADDRESS } from "@/config";
import { router } from "expo-router";
import { Alert } from "react-native";
import User from "@/entities/User";
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
   * @param {string} token
   * @return {Promise<void>}
   */
  async saveUser(user: User) {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      console.error("Ошибка при сохранении user:", e);
    }
  },

  /**
   * @return {Promise<string|null>}
   */
  async getUser() {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user !== null) {
        return JSON.parse(user);
      }
    } catch (e) {
      console.error("Ошибка при получении user:", e);
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
      const e = error as AxiosError;
      console.error("Refresh error details:", {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
      });

      if (
        e.response?.status === 401 &&
        (e.response.data as any)?.message
          ?.toLowerCase()
          .includes("refresh token expired")
      ) {
        console.log("Refresh token expired, clearing all tokens");
        await this.clearTokens();
        onUnauthorized?.();
      }
      throw error;
    }
  },

  async makeAuthenticatedRequest(
    requestConfig: any,
    onUnauthorized: UnauthorizedCallback = () => {
      router.push("/(auth)/loginScreen");
    }
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
        const e = error as AxiosError;
        console.log("Request failed:", {
          status: e.response?.status,
          data: e.response?.data,
        });

        if (e.response?.status === 401) {
          const errorMessage = (e.response.data as any)?.message?.toLowerCase();
          const isTokenExpired = errorMessage?.includes("expired");

          if (isTokenExpired) {
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
          } else {
            await this.clearTokens();
            onUnauthorized?.();
          }
        }
        throw error;
      }
    } catch (error) {
      const e = error as Error;
      console.error("Authentication error:", {
        message: e.message,
        stack: e.stack,
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

  async refreshTokens(refreshToken: string) {
    try {
      const response = await axios.post(
        `${API_ADDRESS}auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Refresh request payload:", { refreshToken });
      console.log("Refresh response headers:", response.headers);
      console.log("Refresh response:", response.data);
      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    } catch (error) {
      console.error("Ошибка обновления токенов:", error);
      throw error;
    }
  },
};

export default tokenService;
