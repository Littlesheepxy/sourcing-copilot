/**
 * 对象操作工具函数
 */

/**
 * 安全地从对象中获取嵌套属性值
 * @param obj 目标对象
 * @param path 属性路径，可以是点分隔的字符串或字符串数组
 * @param defaultValue 默认值，如果路径不存在则返回此值
 * @returns 属性值或默认值
 */
export function get(obj: any, path: string | string[], defaultValue?: any): any {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    
    result = result[key];
    
    if (result === undefined) {
      return defaultValue;
    }
  }
  
  return result;
}

/**
 * 设置对象的嵌套属性值
 * @param obj 目标对象
 * @param path 属性路径，可以是点分隔的字符串或字符串数组
 * @param value 要设置的值
 * @returns 修改后的对象
 */
export function set(obj: any, path: string | string[], value: any): any {
  if (!obj) {
    return obj;
  }
  
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  const lastKey = pathArray[pathArray.length - 1];
  current[lastKey] = value;
  
  return obj;
}

/**
 * 删除对象的嵌套属性
 * @param obj 目标对象
 * @param path 属性路径，可以是点分隔的字符串或字符串数组
 * @returns 是否成功删除
 */
export function unset(obj: any, path: string | string[]): boolean {
  if (!obj) {
    return false;
  }
  
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    
    if (current[key] === undefined || current[key] === null) {
      return false;
    }
    
    current = current[key];
  }
  
  const lastKey = pathArray[pathArray.length - 1];
  
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  
  return false;
}

/**
 * 深度合并对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result: any = { ...target };
  
  if (!source) {
    return result;
  }
  
  Object.keys(source).forEach((key) => {
    const sourceValue = (source as any)[key];
    const targetValue = (target as any)[key];
    
    if (
      sourceValue && 
      typeof sourceValue === 'object' && 
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  });
  
  return result;
} 