/**
 * 📚 知识点：简单的上传功能测试
 * 
 * 这个简化版本的测试用于快速验证上传功能
 */

import * as XLSX from 'xlsx'
import { ExcelService } from './services/excel.js'

/**
 * 📚 知识点：测试Excel解析功能
 * 直接测试ExcelService的解析功能
 */
function testExcelParsing(): void {
  console.log('📊 测试Excel解析功能...')
  
  try {
    // 创建测试数据
    const testData = [
      ['项目名称'], // 表头
      ['市政道路建设项目A'],
      ['城市绿化工程B'],
      ['污水处理厂升级改造'],
      [''], // 空行测试
      ['桥梁维修工程'],
      ['地铁站点建设']
    ]

    // 创建Excel文件
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '项目列表')
    
    // 生成Buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })
    
    console.log(`✅ 创建测试Excel文件，大小: ${buffer.length} bytes`)
    
    // 测试文件验证
    console.log('\n🔍 测试文件验证...')
    const validation = ExcelService.validateExcelFile(buffer, 'test.xlsx')
    console.log(`验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`)
    if (!validation.valid) {
      console.log(`错误信息: ${validation.error}`)
      return
    }
    
    // 测试Excel解析
    console.log('\n📋 测试Excel解析...')
    const parseResult = ExcelService.parseExcelBuffer(buffer)
    
    console.log('解析结果:')
    console.log(`  总行数: ${parseResult.totalRows}`)
    console.log(`  有效行数: ${parseResult.validRows}`)
    console.log(`  项目数量: ${parseResult.projects.length}`)
    console.log(`  错误数量: ${parseResult.errors.length}`)
    
    if (parseResult.projects.length > 0) {
      console.log('  项目列表:')
      parseResult.projects.forEach((project, index) => {
        console.log(`    ${index + 1}. ${project}`)
      })
    }
    
    if (parseResult.errors.length > 0) {
      console.log('  错误列表:')
      parseResult.errors.forEach(error => {
        console.log(`    - ${error}`)
      })
    }
    
    // 生成报告
    console.log('\n📊 解析报告:')
    const report = ExcelService.generateParseReport(parseResult)
    console.log(report)
    
    console.log('\n✅ Excel解析功能测试完成')
    
  } catch (error) {
    console.error('❌ Excel解析测试失败:', error)
  }
}

/**
 * 📚 知识点：测试文件验证功能
 */
function testFileValidation(): void {
  console.log('\n🧪 测试文件验证功能...')
  
  const testCases = [
    {
      name: '有效的Excel文件',
      filename: 'test.xlsx',
      buffer: Buffer.from('test'),
      expected: true
    },
    {
      name: '无效的文件扩展名',
      filename: 'test.txt',
      buffer: Buffer.from('test'),
      expected: false
    },
    {
      name: '空文件',
      filename: 'empty.xlsx',
      buffer: Buffer.alloc(0),
      expected: false
    }
  ]
  
  testCases.forEach(testCase => {
    console.log(`\n📝 测试: ${testCase.name}`)
    
    try {
      const result = ExcelService.validateExcelFile(testCase.buffer, testCase.filename)
      const passed = result.valid === testCase.expected
      
      console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}`)
      console.log(`  验证: ${result.valid ? '有效' : '无效'}`)
      if (!result.valid && result.error) {
        console.log(`  错误: ${result.error}`)
      }
      
    } catch (error) {
      console.log(`  异常: ${error}`)
    }
  })
}

/**
 * 📚 知识点：主测试函数
 */
function runTests(): void {
  console.log('🧪 开始执行Excel服务测试')
  console.log('='.repeat(40))
  
  testExcelParsing()
  testFileValidation()
  
  console.log('\n' + '='.repeat(40))
  console.log('🎉 所有测试完成！')
}

// 运行测试
runTests()