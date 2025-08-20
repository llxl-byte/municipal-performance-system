// 请求重试工具
// 📚 知识点：指数退避重试策略

export interface RetryOptions {
  maxRetries?: number;      // 最大重试次数
  baseDelay?: number;       // 基础延迟时间（毫秒）
  maxDelay?: number;        // 最大延迟时间（毫秒）
  retryCondition?: (error: any) => boolean; // 重试条件判断
}

/**
 * 📚 知识点：指数退避算法
 * 
 * 指数退避是一种错误恢复机制，当请求失败时：
 * 1. 第一次重试：等待 baseDelay 毫秒
 * 2. 第二次重试：等待 baseDelay * 2 毫秒
 * 3. 第三次重试：等待 baseDelay * 4 毫秒
 * 以此类推，直到达到 maxDelay 或 maxRetries
 * 
 * 这样可以避免在服务器压力大时继续施加压力
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = (error) => {
      // 默认重试条件：网络错误或5xx服务器错误
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        (error.response && error.response.status >= 500)
      );
    }
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 请求尝试 ${attempt + 1}/${maxRetries + 1}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        console.error(`❌ 请求失败，已达到最大重试次数 ${maxRetries}`);
        throw error;
      }

      // 检查是否满足重试条件
      if (!retryCondition(error)) {
        console.log(`⏭️ 错误不满足重试条件，直接抛出:`, error.message);
        throw error;
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`⏳ 等待 ${delay}ms 后重试...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * 📚 知识点：带重试的API请求包装器
 * 
 * 这个函数将普通的API请求包装成带重试功能的请求
 * 可以用于包装axios请求或fetch请求
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  retryOptions?: RetryOptions
): T {
  return ((...args: Parameters<T>) => {
    return retryRequest(() => apiFunction(...args), retryOptions);
  }) as T;
}

/**
 * 📚 知识点：网络状态检测
 * 
 * 检测当前网络连接状态，用于决定是否进行重试
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 📚 知识点：网络状态监听
 * 
 * 监听网络状态变化，可以用于在网络恢复时自动重试
 */
export function onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 📚 知识点：请求超时处理
 * 
 * 为请求添加超时控制，防止请求无限等待
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = '请求超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    })
  ]);
}

/**
 * 📚 知识点：请求去重
 * 
 * 防止相同的请求在短时间内重复发送
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * 生成请求的唯一键
   */
  private generateKey(url: string, method: string, data?: any): string {
    return `${method}:${url}:${JSON.stringify(data || {})}`;
  }

  /**
   * 去重请求
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // 如果相同请求正在进行中，直接返回该请求的Promise
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 请求去重: ${key}`);
      return this.pendingRequests.get(key);
    }

    // 执行新请求
    const promise = requestFn().finally(() => {
      // 请求完成后清除缓存
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 清除所有待处理请求
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

// 导出全局请求去重器实例
export const requestDeduplicator = new RequestDeduplicator();