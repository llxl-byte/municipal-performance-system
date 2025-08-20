// 大文件分片上传工具
// 📚 知识点：分片上传可以提高大文件上传的成功率和用户体验

export interface ChunkUploadOptions {
  chunkSize?: number;           // 分片大小（字节），默认2MB
  maxConcurrent?: number;       // 最大并发上传数，默认3
  retryTimes?: number;          // 重试次数，默认3
  onProgress?: (progress: number) => void;  // 进度回调
  onChunkProgress?: (chunkIndex: number, progress: number) => void; // 分片进度回调
  onError?: (error: Error) => void;         // 错误回调
}

export interface ChunkInfo {
  index: number;                // 分片索引
  start: number;                // 开始位置
  end: number;                  // 结束位置
  size: number;                 // 分片大小
  hash?: string;                // 分片哈希值（用于断点续传）
}

export interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  uploadId?: string;            // 上传ID（用于断点续传）
}

/**
 * 📚 知识点：文件哈希计算
 * 
 * 使用Web Crypto API计算文件哈希值
 * 用于文件去重和断点续传
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 📚 知识点：分片信息生成
 * 
 * 将文件分割成多个分片，每个分片包含位置和大小信息
 */
export function createChunks(file: File, chunkSize: number = 2 * 1024 * 1024): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const totalSize = file.size;
  let start = 0;
  let index = 0;

  while (start < totalSize) {
    const end = Math.min(start + chunkSize, totalSize);
    chunks.push({
      index,
      start,
      end,
      size: end - start
    });
    start = end;
    index++;
  }

  console.log(`📦 文件分片完成: ${chunks.length}个分片，每片${(chunkSize / 1024 / 1024).toFixed(1)}MB`);
  return chunks;
}

/**
 * 📚 知识点：分片上传类
 * 
 * 实现分片上传的核心逻辑，包括：
 * 1. 文件分片
 * 2. 并发控制
 * 3. 进度追踪
 * 4. 错误重试
 * 5. 断点续传
 */
export class ChunkedUploader {
  private file: File;
  private options: Required<ChunkUploadOptions>;
  private chunks: ChunkInfo[] = [];
  private uploadedChunks: Set<number> = new Set();
  private uploadId: string = '';
  private aborted: boolean = false;

  constructor(file: File, options: ChunkUploadOptions = {}) {
    this.file = file;
    this.options = {
      chunkSize: options.chunkSize || 2 * 1024 * 1024, // 2MB
      maxConcurrent: options.maxConcurrent || 3,
      retryTimes: options.retryTimes || 3,
      onProgress: options.onProgress || (() => {}),
      onChunkProgress: options.onChunkProgress || (() => {}),
      onError: options.onError || (() => {})
    };
  }

  /**
   * 📚 知识点：开始上传
   * 
   * 上传流程：
   * 1. 初始化上传会话
   * 2. 创建文件分片
   * 3. 并发上传分片
   * 4. 合并分片
   */
  async upload(): Promise<UploadResult> {
    try {
      console.log(`🚀 开始分片上传: ${this.file.name} (${(this.file.size / 1024 / 1024).toFixed(2)}MB)`);

      // 1. 初始化上传会话
      await this.initializeUpload();

      // 2. 创建分片
      this.chunks = createChunks(this.file, this.options.chunkSize);

      // 3. 检查已上传的分片（断点续传）
      await this.checkUploadedChunks();

      // 4. 上传分片
      await this.uploadChunks();

      // 5. 合并分片
      const result = await this.mergeChunks();

      console.log('✅ 分片上传完成');
      return result;

    } catch (error) {
      console.error('❌ 分片上传失败:', error);
      this.options.onError(error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 📚 知识点：初始化上传会话
   * 
   * 向服务器发送上传初始化请求，获取uploadId
   */
  private async initializeUpload(): Promise<void> {
    const fileHash = await calculateFileHash(this.file);
    
    const response = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: this.file.name,
        fileSize: this.file.size,
        fileHash,
        chunkSize: this.options.chunkSize,
        totalChunks: Math.ceil(this.file.size / this.options.chunkSize)
      })
    });

    if (!response.ok) {
      throw new Error('初始化上传失败');
    }

    const data = await response.json();
    this.uploadId = data.uploadId;
    
    console.log(`📋 上传会话初始化完成: ${this.uploadId}`);
  }

  /**
   * 📚 知识点：检查已上传分片
   * 
   * 用于断点续传，检查哪些分片已经上传成功
   */
  private async checkUploadedChunks(): Promise<void> {
    try {
      const response = await fetch(`/api/upload/chunks/${this.uploadId}`);
      if (response.ok) {
        const data = await response.json();
        this.uploadedChunks = new Set(data.uploadedChunks || []);
        console.log(`🔄 断点续传: 已上传${this.uploadedChunks.size}/${this.chunks.length}个分片`);
      }
    } catch (error) {
      console.warn('检查已上传分片失败，将重新上传所有分片');
    }
  }

  /**
   * 📚 知识点：并发上传分片
   * 
   * 使用Promise.allSettled控制并发数量，避免过多并发请求
   */
  private async uploadChunks(): Promise<void> {
    const pendingChunks = this.chunks.filter(chunk => !this.uploadedChunks.has(chunk.index));
    
    if (pendingChunks.length === 0) {
      console.log('✅ 所有分片已上传完成');
      return;
    }

    console.log(`📤 开始上传${pendingChunks.length}个分片`);

    // 📚 知识点：并发控制
    // 使用滑动窗口控制并发数量
    for (let i = 0; i < pendingChunks.length; i += this.options.maxConcurrent) {
      if (this.aborted) {
        throw new Error('上传已取消');
      }

      const batch = pendingChunks.slice(i, i + this.options.maxConcurrent);
      const promises = batch.map(chunk => this.uploadChunk(chunk));
      
      // 等待当前批次完成
      const results = await Promise.allSettled(promises);
      
      // 检查是否有失败的上传
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error(`❌ 批次上传失败: ${failures.length}/${batch.length}`);
        throw new Error(`分片上传失败: ${failures.length}个分片上传失败`);
      }

      // 更新总体进度
      const totalUploaded = this.uploadedChunks.size;
      const progress = (totalUploaded / this.chunks.length) * 100;
      this.options.onProgress(progress);
    }
  }

  /**
   * 📚 知识点：上传单个分片
   * 
   * 包含重试逻辑和进度追踪
   */
  private async uploadChunk(chunk: ChunkInfo): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retryTimes; attempt++) {
      try {
        if (this.aborted) {
          throw new Error('上传已取消');
        }

        console.log(`📤 上传分片 ${chunk.index + 1}/${this.chunks.length} (尝试 ${attempt + 1})`);

        // 创建分片数据
        const chunkBlob = this.file.slice(chunk.start, chunk.end);
        const formData = new FormData();
        formData.append('chunk', chunkBlob);
        formData.append('uploadId', this.uploadId);
        formData.append('chunkIndex', chunk.index.toString());
        formData.append('chunkSize', chunk.size.toString());

        // 上传分片
        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`分片上传失败: HTTP ${response.status}`);
        }

        // 标记分片已上传
        this.uploadedChunks.add(chunk.index);
        this.options.onChunkProgress(chunk.index, 100);
        
        console.log(`✅ 分片 ${chunk.index + 1} 上传成功`);
        return;

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ 分片 ${chunk.index + 1} 上传失败 (尝试 ${attempt + 1}):`, error);

        if (attempt < this.options.retryTimes) {
          // 等待后重试
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`分片 ${chunk.index + 1} 上传失败`);
  }

  /**
   * 📚 知识点：合并分片
   * 
   * 所有分片上传完成后，通知服务器合并分片
   */
  private async mergeChunks(): Promise<UploadResult> {
    console.log('🔗 开始合并分片...');

    const response = await fetch('/api/upload/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
        fileName: this.file.name,
        totalChunks: this.chunks.length
      })
    });

    if (!response.ok) {
      throw new Error('合并分片失败');
    }

    const result = await response.json();
    console.log('✅ 分片合并完成');
    
    return result;
  }

  /**
   * 📚 知识点：取消上传
   * 
   * 提供取消上传的功能
   */
  abort(): void {
    this.aborted = true;
    console.log('🛑 上传已取消');
  }

  /**
   * 📚 知识点：获取上传进度
   * 
   * 返回当前上传进度
   */
  getProgress(): number {
    return (this.uploadedChunks.size / this.chunks.length) * 100;
  }
}

/**
 * 📚 知识点：便捷的上传函数
 * 
 * 提供简单的API接口
 */
export async function uploadFileInChunks(
  file: File, 
  options?: ChunkUploadOptions
): Promise<UploadResult> {
  const uploader = new ChunkedUploader(file, options);
  return uploader.upload();
}