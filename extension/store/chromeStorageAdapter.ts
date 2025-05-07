/**
 * Chrome存储适配器
 */
import { StorageAdapter } from '../../packages/store-factory/types';

/**
 * Chrome存储适配器实现
 * 基于chrome.storage.local API
 */
export class ChromeStorageAdapter<T> implements StorageAdapter<T> {
  /**
   * 保存数据到Chrome存储
   * @param key 存储键
   * @param data 要存储的数据
   */
  async save(key: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [key]: data }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 从Chrome存储加载数据
   * @param key 存储键
   * @returns 加载的数据，不存在则返回null
   */
  async load(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key] || null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 从Chrome存储删除数据
   * @param key 存储键
   */
  async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
} 