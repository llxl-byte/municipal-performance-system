# UploadComponent 使用文档

## 📚 组件概述

`UploadComponent` 是一个专门用于Excel文件上传的React组件，基于Ant Design的Upload组件开发，提供了完整的文件上传、验证、进度显示和结果展示功能。

## 🎯 主要特性

- ✅ **文件验证**：自动验证Excel文件格式(.xlsx, .xls)和大小
- 📊 **进度显示**：实时显示上传进度条
- 🔄 **错误处理**：友好的错误提示和处理机制
- 📈 **结果展示**：详细的上传结果统计信息
- ⚙️ **高度可配置**：支持多种配置选项
- 🔗 **回调支持**：提供成功和失败回调函数
- 🎨 **响应式设计**：适配不同屏幕尺寸

## 📦 安装和导入

```typescript
import UploadComponent from '../components/UploadComponent'
import { UploadResult } from '../types/upload'
```

## 🚀 基础用法

### 最简单的使用方式

```typescript
import React from 'react'
import UploadComponent from './components/UploadComponent'

const MyPage: React.FC = () => {
  const handleSuccess = (result: UploadResult) => {
    console.log('上传成功:', result)
  }

  const handleError = (error: string) => {
    console.error('上传失败:', error)
  }

  return (
    <UploadComponent 
      onUploadSuccess={handleSuccess}
      onUploadError={handleError}
    />
  )
}
```

### 自定义配置

```typescript
<UploadComponent 
  maxFileSize={5}        // 限制文件大小为5MB
  disabled={false}       // 是否禁用
  showResult={true}      // 是否显示上传结果
  onUploadSuccess={handleSuccess}
  onUploadError={handleError}
/>
```

## 📋 Props 配置

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `onUploadSuccess` | `(result: UploadResult) => void` | - | ❌ | 上传成功回调函数 |
| `onUploadError` | `(error: string) => void` | - | ❌ | 上传失败回调函数 |
| `maxFileSize` | `number` | `10` | ❌ | 最大文件大小（MB） |
| `disabled` | `boolean` | `false` | ❌ | 是否禁用上传功能 |
| `showResult` | `boolean` | `true` | ❌ | 是否显示上传结果 |

## 📊 数据结构

### UploadResult 接口

```typescript
interface UploadResult {
  file: {
    name: string      // 文件名
    size: number      // 文件大小（字节）
    type: string      // 文件类型
  }
  parsing: {
    totalRows: number           // 总行数
    validRows: number          // 有效行数
    extractedProjects: number  // 提取的项目数
    errors: string[]           // 解析错误列表
  }
  import: {
    totalRows: number                                    // 导入总行数
    insertedRows: number                                // 新插入行数
    duplicateRows: number                               // 重复行数
    insertedProjects: Array<{ id: number; name: string }> // 新插入的项目
    duplicateProjects: string[]                         // 重复的项目名称
  }
  summary: {
    message: string    // 总结消息
    details: {
      newProjects: string[]       // 新项目列表
      duplicateProjects: string[] // 重复项目列表
      parseErrors: string[]       // 解析错误列表
    }
  }
}
```

## 🔧 使用场景

### 1. 在页面中使用

```typescript
// pages/UploadPage.tsx
import React, { useState } from 'react'
import { Card } from 'antd'
import UploadComponent from '../components/UploadComponent'
import { UploadResult } from '../types/upload'

const UploadPage: React.FC = () => {
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleSuccess = (uploadResult: UploadResult) => {
    setResult(uploadResult)
    // 可以在这里添加其他逻辑，如刷新列表、显示通知等
  }

  return (
    <Card title="文件上传">
      <UploadComponent 
        onUploadSuccess={handleSuccess}
        maxFileSize={10}
      />
      
      {result && (
        <div>
          <h3>上传结果</h3>
          <p>新增项目：{result.import.insertedRows}</p>
          <p>重复项目：{result.import.duplicateRows}</p>
        </div>
      )}
    </Card>
  )
}
```

### 2. 在模态框中使用

```typescript
// components/UploadModal.tsx
import React, { useState } from 'react'
import { Modal, Button } from 'antd'
import UploadComponent from './UploadComponent'

const UploadModal: React.FC = () => {
  const [visible, setVisible] = useState(false)

  const handleSuccess = (result: UploadResult) => {
    console.log('上传成功:', result)
    setVisible(false) // 关闭模态框
  }

  return (
    <>
      <Button onClick={() => setVisible(true)}>
        上传文件
      </Button>
      
      <Modal
        title="上传Excel文件"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <UploadComponent 
          onUploadSuccess={handleSuccess}
          showResult={false}  // 模态框中可能不需要显示详细结果
        />
      </Modal>
    </>
  )
}
```

### 3. 批量上传场景

```typescript
const BatchUploadPage: React.FC = () => {
  const [uploadCount, setUploadCount] = useState(0)
  const [totalInserted, setTotalInserted] = useState(0)

  const handleSuccess = (result: UploadResult) => {
    setUploadCount(prev => prev + 1)
    setTotalInserted(prev => prev + result.import.insertedRows)
  }

  return (
    <div>
      <h2>批量上传统计</h2>
      <p>已上传文件：{uploadCount}</p>
      <p>总计导入项目：{totalInserted}</p>
      
      <UploadComponent 
        onUploadSuccess={handleSuccess}
        maxFileSize={20}  // 批量上传可能需要更大的文件
      />
    </div>
  )
}
```

## ⚠️ 注意事项

### 文件格式要求
- 支持 `.xlsx` 和 `.xls` 格式
- 第一列应为项目名称
- 系统会自动跳过表头行
- 项目名称不能为空且不超过200字符

### 文件大小限制
- 默认最大10MB，可通过 `maxFileSize` 属性调整
- 建议根据服务器配置和网络环境合理设置

### 错误处理
- 组件内部已处理常见错误情况
- 建议在 `onUploadError` 回调中添加业务相关的错误处理逻辑

### 性能考虑
- 大文件上传时会显示进度条
- 组件内部使用了防抖和节流优化
- 建议在生产环境中配置适当的超时时间

## 🔍 调试和故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件格式是否正确
   - 确认文件大小是否超出限制
   - 查看浏览器控制台错误信息

2. **回调函数不执行**
   - 确认已正确传递回调函数
   - 检查函数签名是否匹配

3. **进度条不显示**
   - 确认网络连接正常
   - 检查后端API是否正常响应

### 调试技巧

```typescript
// 开启详细日志
const handleSuccess = (result: UploadResult) => {
  console.log('📊 详细上传结果:', JSON.stringify(result, null, 2))
}

const handleError = (error: string) => {
  console.error('🚨 上传错误详情:', error)
}
```

## 🚀 扩展和自定义

### 自定义样式

```typescript
// 可以通过CSS类名自定义样式
<div className="custom-upload-wrapper">
  <UploadComponent {...props} />
</div>
```

### 添加自定义验证

```typescript
// 可以在回调中添加额外的验证逻辑
const handleSuccess = (result: UploadResult) => {
  // 自定义验证
  if (result.import.insertedRows === 0) {
    message.warning('没有新数据被导入')
    return
  }
  
  // 继续处理...
}
```

## 📝 更新日志

- **v1.0.0**: 初始版本，支持基础上传功能
- **v1.1.0**: 添加类型定义文件，优化错误处理
- **v1.2.0**: 增加可配置选项，改进用户体验

## 🤝 贡献指南

如果你想为这个组件贡献代码或报告问题，请：

1. 查看现有的issues
2. 创建详细的bug报告或功能请求
3. 提交Pull Request时请包含测试用例
4. 遵循项目的代码规范

## 📄 许可证

MIT License