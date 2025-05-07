/**
 * 状态管理工厂实现
 */
import { create, StateCreator, StoreApi as ZustandStoreApi, UseBoundStore } from 'zustand';
import {
  GetState,
  InitializableStore,
  Initializer,
  PersistConfig,
  SetState,
  StoreApi,
  StorageAdapter
} from './types';

/**
 * 创建支持持久化的状态存储
 * @param initializer 状态初始化函数
 * @param config 持久化配置
 * @returns 状态存储对象
 */
export function createPersistentStore<T extends object>(
  initializer: Initializer<T>,
  config: PersistConfig<T>
): UseBoundStore<ZustandStoreApi<T & { initialize: () => Promise<void> }>> {
  const { adapter, keys, prefix = 'sc_' } = config;
  const storageKey = `${prefix}store`;
  
  // 增强的状态创建器，支持持久化
  const enhancedInitializer: StateCreator<T & { initialize: () => Promise<void> }> = (set, get, api) => {
    // 创建增强版的set函数，支持自动持久化
    const enhancedSet: SetState<T> = (partial, replace) => {
      // 使用原始set更新状态
      set(partial as any, replace);
      
      // 异步保存需要持久化的数据
      const currentState = get() as unknown as T;
      const persistData: Partial<T> = {};
      
      for (const key of keys) {
        if (key in currentState) {
          persistData[key] = currentState[key];
        }
      }
      
      adapter.save(storageKey, persistData).catch(err => {
        console.error('Failed to persist state:', err);
      });
    };
    
    // 初始化状态
    const initialState = initializer(
      enhancedSet, 
      () => get() as unknown as T,
      api as unknown as StoreApi<T>
    );
    
    // 添加初始化方法
    return {
      ...initialState,
      initialize: async () => {
        try {
          const data = await adapter.load(storageKey);
          if (data) {
            set(data as any);
          }
        } catch (err) {
          console.error('Failed to initialize state from storage:', err);
        }
      }
    };
  };
  
  // 创建store
  return create(enhancedInitializer);
}

/**
 * 创建有初始化功能但不持久化的状态存储
 * @param initializer 状态初始化函数
 * @returns 状态存储对象
 */
export function createStore<T extends object>(
  initializer: Initializer<T>
): UseBoundStore<ZustandStoreApi<T & { initialize: () => Promise<void> }>> {
  // 增强的状态创建器，添加初始化方法
  const enhancedInitializer: StateCreator<T & { initialize: () => Promise<void> }> = (set, get, api) => {
    // 初始化状态
    const initialState = initializer(
      set as unknown as SetState<T>,
      () => get() as unknown as T,
      api as unknown as StoreApi<T>
    );
    
    // 添加初始化方法
    return {
      ...initialState,
      initialize: async () => {
        // 对于非持久化存储，初始化方法不做任何操作
      }
    };
  };
  
  // 创建store
  return create(enhancedInitializer);
}

/**
 * 工具函数：从存储对象中选择特定的键
 * @param obj 源对象
 * @param keys 要选择的键数组
 * @returns 只包含选定键的新对象
 */
export function selectKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}