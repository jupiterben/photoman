import { logger } from '../utils/logger';
import { handleError } from '../utils/error-handler';

/**
 * 服务基类
 * 提供通用的初始化和错误处理功能
 */
export abstract class BaseService {
  protected serviceName: string;
  protected initialized: boolean = false;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * 初始化服务（子类需实现）
   */
  protected abstract initializeService(): Promise<void> | void;

  /**
   * 清理服务资源（子类可选实现）
   */
  protected cleanupService(): Promise<void> | void {
    // 默认实现：不做任何操作
  }

  /**
   * 公共初始化方法
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn(`[${this.serviceName}] Service is already initialized`);
      return;
    }

    try {
      logger.info(`[${this.serviceName}] Initializing service...`);
      await this.initializeService();
      this.initialized = true;
      logger.info(`[${this.serviceName}] Service initialized successfully`);
    } catch (error) {
      const appError = handleError(error, { service: this.serviceName });
      logger.error(`[${this.serviceName}] Failed to initialize service`, appError);
      throw appError;
    }
  }

  /**
   * 公共清理方法
   */
  public async cleanup(): Promise<void> {
    if (!this.initialized) {
      logger.warn(`[${this.serviceName}] Service is not initialized, skipping cleanup`);
      return;
    }

    try {
      logger.info(`[${this.serviceName}] Cleaning up service...`);
      await this.cleanupService();
      this.initialized = false;
      logger.info(`[${this.serviceName}] Service cleaned up successfully`);
    } catch (error) {
      const appError = handleError(error, { service: this.serviceName });
      logger.error(`[${this.serviceName}] Failed to cleanup service`, appError);
      throw appError;
    }
  }

  /**
   * 检查服务是否已初始化
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.serviceName} is not initialized. Call initialize() first.`);
    }
  }

  /**
   * 包装方法调用，添加日志和错误处理
   */
  protected async wrapMethod<T>(
    methodName: string,
    fn: () => Promise<T>,
    args?: any
  ): Promise<T> {
    this.ensureInitialized();

    try {
      logger.debug(`[${this.serviceName}] Calling ${methodName}`, args);
      const result = await fn();
      logger.debug(`[${this.serviceName}] ${methodName} completed successfully`);
      return result;
    } catch (error) {
      const appError = handleError(error, {
        service: this.serviceName,
        method: methodName,
        args,
      });
      logger.error(`[${this.serviceName}] ${methodName} failed`, appError);
      throw appError;
    }
  }

  /**
   * 获取服务名称
   */
  public getServiceName(): string {
    return this.serviceName;
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}


