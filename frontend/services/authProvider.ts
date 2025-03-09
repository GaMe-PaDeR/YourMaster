import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import tokenService from './tokenService';
import { API_ADDRESS } from '@/config';
import { router } from 'expo-router';

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

class AuthProvider {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_ADDRESS,
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const accessToken = await tokenService.getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          const errorMessage = (error.response.data as any)?.message?.toLowerCase();
          const isTokenExpired = errorMessage?.includes("expired");

          if (isTokenExpired) {
            originalRequest._retry = true;

            try {
              const refreshToken = await tokenService.getRefreshToken();
              if (!refreshToken) {
                throw new Error('No refresh token');
              }

              const { accessToken, refreshToken: newRefreshToken } = await tokenService.refreshTokens(refreshToken);
              await tokenService.saveAccessToken(accessToken);
              await tokenService.saveRefreshToken(newRefreshToken);

              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              await tokenService.clearTokens();
              router.navigate('../(auth)/loginScreen');
              return Promise.reject(refreshError);
            }
          } else {
            await tokenService.clearTokens();
            router.navigate('../(auth)/loginScreen');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }
}

export default new AuthProvider(); 