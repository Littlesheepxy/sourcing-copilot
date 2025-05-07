/**
 * 状态管理工厂类型定义
 */

/**
 * 存储适配器接口
 * 用于提供不同环境下的存储实现
 */
export interface StorageAdapter<T> {
  /**
   * 保存数据到存储
   * @param key 存储键
   * @param data 要存储的数据
   */
  save(key: string, data: T): Promise<void>;
  
  /**
   * 从存储加载数据
   * @param key 存储键
   * @returns 加载的数据，不存在则返回null
   */
  load(key: string): Promise<T | null>;
  
  /**
   * 从存储删除数据
   * @param key 存储键
   */
  remove(key: string): Promise<void>;
}

/**
 * 初始化函数类型
 * 用于创建初始状态
 */
export type Initializer<T> = (
  set: SetState<T>, 
  get: GetState<T>, 
  api: StoreApi<T>
) => T;

/**
 * 设置状态函数类型
 */
export type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

/**
 * 获取状态函数类型
 */
export type GetState<T> = () => T;

/**
 * 存储API类型
 */
export interface StoreApi<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  destroy: () => void;
}

/**
 * 持久化存储配置
 */
export interface PersistConfig<T> {
  /**
   * 存储适配器
   */
  adapter: StorageAdapter<Partial<T>>;
  
  /**
   * 要持久化的键列表
   */
  keys: (keyof T)[];
  
  /**
   * 存储名称前缀
   */
  prefix?: string;
}

/**
 * 可初始化的Store
 */
export interface InitializableStore<T> extends StoreApi<T> {
  /**
   * 初始化Store，从存储加载数据
   */
  initialize: () => Promise<void>;
} 