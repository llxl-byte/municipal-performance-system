// Excel文件解析服务
import * as XLSX from 'xlsx'

// Excel解析结果接口
export interface ExcelParseResult {
  projects: string[]        // 项目名称列表
  totalRows: number        // 总行数
  validRows: number        // 有效行数
  errors: string[]         // 错误信息
}

// Excel解析服务类
export class ExcelService {
  /**
   * 解析Excel文件缓冲区
   * @param buffer Excel文件的二进制数据
   * @returns 解析结果
   */
  static parseExcelBuffer(buffer: Buffer): ExcelParseResult {
    const result: ExcelParseResult = {
      projects: [],
      totalRows: 0,
      validRows: 0,
      errors: []
    }

    try {
      // 读取Excel文件
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      // 获取第一个工作表
      const sheetNames = workbook.SheetNames
      if (sheetNames.length === 0) {
        result.errors.push('Excel文件中没有找到工作表')
        return result
      }

      const firstSheet = workbook.Sheets[sheetNames[0]]
      
      // 将工作表转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
        header: 1,  // 使用数组格式而不是对象格式
        defval: ''  // 空单元格的默认值
      }) as any[][]

      result.totalRows = jsonData.length

      // 处理每一行数据
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const rowNumber = i + 1

        // 跳过空行
        if (!row || row.length === 0 || !row[0]) {
          continue
        }

        // 获取第一列的项目名称
        const projectName = String(row[0]).trim()
        
        // 📚 知识点：跳过表头行
        // 如果是第一行且内容是"项目名称"或类似的表头，则跳过
        if (i === 0 && (
          projectName === '项目名称' || 
          projectName.toLowerCase() === 'project name' ||
          projectName.toLowerCase() === 'name' ||
          projectName === '名称'
        )) {
          console.log(`📋 跳过表头行: ${projectName}`)
          continue
        }
        
        // 验证项目名称
        if (projectName.length === 0) {
          result.errors.push(`第${rowNumber}行：项目名称为空`)
          continue
        }

        if (projectName.length > 200) {
          result.errors.push(`第${rowNumber}行：项目名称过长（超过200字符）`)
          continue
        }

        // 添加到结果中
        result.projects.push(projectName)
        result.validRows++
      }

      console.log(`📊 Excel解析完成: 总行数${result.totalRows}, 有效行数${result.validRows}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      result.errors.push(`Excel文件解析失败: ${errorMessage}`)
      console.error('❌ Excel解析错误:', error)
    }

    return result
  }

  /**
   * 验证Excel文件格式
   * @param buffer 文件缓冲区
   * @param originalName 原始文件名
   * @returns 验证结果
   */
  static validateExcelFile(buffer: Buffer, originalName: string): { valid: boolean; error?: string } {
    // 检查文件扩展名
    const validExtensions = ['.xlsx', '.xls']
    const hasValidExtension = validExtensions.some(ext => 
      originalName.toLowerCase().endsWith(ext)
    )

    if (!hasValidExtension) {
      return {
        valid: false,
        error: '文件格式不支持，请上传.xlsx或.xls格式的Excel文件'
      }
    }

    // 检查文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: '文件大小超过限制（最大10MB）'
      }
    }

    // 检查文件是否为空
    if (buffer.length === 0) {
      return {
        valid: false,
        error: '文件为空'
      }
    }

    // 尝试读取Excel文件，验证是否为有效的Excel文件
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          valid: false,
          error: 'Excel文件中没有找到工作表'
        }
      }
    } catch (error) {
      console.error('Excel文件验证错误:', error)
      
      // 📚 知识点：更严格的Excel文件验证
      // 如果文件扩展名正确但内容无效，说明文件损坏
      if (hasValidExtension) {
        return {
          valid: false,
          error: 'Excel文件格式无效或损坏，请检查文件是否完整'
        }
      } else {
        return {
          valid: false,
          error: 'Excel文件格式无效或损坏'
        }
      }
    }

    return { valid: true }
  }

  /**
   * 生成Excel解析报告
   * @param result 解析结果
   * @returns 格式化的报告
   */
  static generateParseReport(result: ExcelParseResult): string {
    const lines = [
      `📊 Excel文件解析报告`,
      `总行数: ${result.totalRows}`,
      `有效行数: ${result.validRows}`,
      `项目数量: ${result.projects.length}`,
    ]

    if (result.errors.length > 0) {
      lines.push(`错误数量: ${result.errors.length}`)
      lines.push(`错误详情:`)
      result.errors.forEach(error => {
        lines.push(`  - ${error}`)
      })
    }

    return lines.join('\n')
  }
}