/**
 * Web存储适配器
 */
import { StorageAdapter } from '../../../packages/store-factory/types';

/**
 * 基于localStorage的存储适配器
 */
export class WebStorageAdapter<T> implements StorageAdapter<T> {
  /**
   * 存储键前缀
   */
  private prefix: string;
  
  /**
   * 构造函数
   * @param prefix 存储键前缀
   */
  constructor(prefix: string = 'sc_') {
    this.prefix = prefix;
  }
  
  /**
   * 保存数据到localStorage
   * @param key 存储键
   * @param data 要存储的数据
   */
  async save(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error('保存到localStorage失败:', error);
      throw error;
    }
  }
  
  /**
   * 从localStorage加载数据
   * @param key 存储键
   * @returns 加载的数据，不存在则返回null
   */
  async load(key: string): Promise<T | null> {
    try {
      const serialized = localStorage.getItem(this.getKey(key));
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('从localStorage加载失败:', error);
      return null;
    }
  }
  
  /**
   * 从localStorage删除数据
   * @param key 存储键
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('从localStorage删除失败:', error);
      throw error;
    }
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