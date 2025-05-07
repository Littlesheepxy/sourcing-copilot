/**
 * Chrome存储适配器
 */
import { StorageAdapter } from '../../../packages/store-factory/types';

/**
 * 基于chrome.storage的存储适配器
 */
export class ChromeStorageAdapter<T> implements StorageAdapter<T> {
  /**
   * 存储键前缀
   */
  private prefix: string;
  
  /**
   * 存储区域，可选local或sync
   */
  private storageArea: 'local' | 'sync';
  
  /**
   * 构造函数
   * @param prefix 存储键前缀
   * @param storageArea 存储区域
   */
  constructor(prefix: string = 'sc_', storageArea: 'local' | 'sync' = 'local') {
    this.prefix = prefix;
    this.storageArea = storageArea;
  }
  
  /**
   * 获取存储API
   * @returns chrome存储API
   */
  private getStorage() {
    return this.storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
  }
  
  /**
   * 保存数据到chrome.storage
   * @param key 存储键
   * @param data 要存储的数据
   */
  async save(key: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.getStorage().set({ [this.getKey(key)]: data }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.error('保存到chrome.storage失败:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 从chrome.storage加载数据
   * @param key 存储键
   * @returns 加载的数据，不存在则返回null
   */
  async load(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        this.getStorage().get(this.getKey(key), (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          
          const data = result[this.getKey(key)];
          resolve(data || null);
        });
      } catch (error) {
        console.error('从chrome.storage加载失败:', error);
        resolve(null);
      }
    });
  }
  
  /**
   * 从chrome.storage删除数据
   * @param key 存储键
   */
  async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.getStorage().remove(this.getKey(key), () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.error('从chrome.storage删除失败:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 获取完整存储键
   * @param key 原始键
   * @returns 添加前缀后的完整键
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
} 