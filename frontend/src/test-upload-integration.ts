// 测试前后端文件上传集成
import * as XLSX from 'xlsx'

// 创建测试Excel文件并下载
export function createAndDownloadTestExcel() {
  console.log('📊 创建测试Excel文件...')
  
  // 创建测试数据
  const testData = [
    ['项目名称'], // 表头
    ['前端测试项目A'],
    ['前端测试项目B'],
    ['前端测试项目C'],
    [''], // 空行测试
    ['前端测试项目D'],
    ['   '], // 空格测试
    ['前端测试项目E'],
    [`超长项目名称测试_${'x'.repeat(250)}`], // 超长名称测试
    ['前端测试项目F']
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  XLSX.utils.book_append_sheet(workbook, worksheet, '前端测试')
  
  // 生成Excel文件并下载
  XLSX.writeFile(workbook, '前端测试市政项目.xlsx')
  
  console.log('✅ 测试Excel文件已生成并下载')
  console.log('请在浏览器中打开 http://localhost:3000 并导航到上传页面进行测试')
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 添加到全局对象，方便在控制台调用
  (window as any).createTestExcel = createAndDownloadTestExcel
  console.log('💡 在浏览器控制台中运行 createTestExcel() 来生成测试文件')
}

export default createAndDownloadTestExcel