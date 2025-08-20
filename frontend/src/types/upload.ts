/**
 * 📚 知识点：TypeScript类型定义文件
 * 
 * 将类型定义单独放在types目录中有以下好处：
 * 1. 代码组织更清晰
 * 2. 类型可以在多个文件中复用
 * 3. 便于维护和修改
 * 4. 符合TypeScript最佳实践
 */

/**
 * 上传文件信息接口
 */
export interface UploadFileInfo {
  name: string      // 文件名
  size: number      // 文件大小（字节）
  type: string      // 文件MIME类型
}

/**
 * 文件解析结果接口
 */
export interface ParseResult {
  totalRows: number           // 总行数
  validRows: number          // 有效行数
  extractedProjects: number  // 提取的项目数
  errors: string[]           // 解析错误列表
}

/**
 * 数据导入结果接口
 */
export interface ImportResult {
  totalRows: number                                    // 导入总行数
  insertedRows: number                                // 新插入行数
  duplicateRows: number                               // 重复行数
  insertedProjects: Array<{ id: number; name: string }> // 新插入的项目
  duplicateProjects: string[]                         // 重复的项目名称
}

/**
 * 上传结果摘要接口
 */
export interface UploadSummary {
  message: string    // 总结消息
  details: {
    newProjects: string[]       // 新项目列表
    duplicateProjects: string[] // 重复项目列表
    parseErrors: string[]       // 解析错误列表
  }
}

/**
 * 完整的上传结果接口
 */
export interface UploadResult {
  file: UploadFileInfo     // 文件信息
  parsing: ParseResult     // 解析结果
  import: ImportResult     // 导入结果
  summary: UploadSummary   // 结果摘要
}

/**
 * 上传组件Props接口
 */
export interface UploadComponentProps {
  onUploadSuccess?: (result: UploadResult) => void  // 上传成功回调函数（可选）
  onUploadError?: (error: string) => void           // 上传失败回调函数（可选）
  maxFileSize?: number                              // 最大文件大小（MB，默认10MB）
  disabled?: boolean                                // 是否禁用上传
  showResult?: boolean                              // 是否显示上传结果（默认true）
  accept?: string                                   // 接受的文件类型
}

/**
 * 上传状态枚举
 */
export enum UploadStatus {
  IDLE = 'idle',           // 空闲状态
  UPLOADING = 'uploading', // 上传中
  SUCCESS = 'success',     // 上传成功
  ERROR = 'error'          // 上传失败
}

/**
 * 文件验证结果接口
 */
export interface FileValidationResult {
  isValid: boolean    // 是否有效
  errorMessage?: string // 错误消息（如果无效）
}