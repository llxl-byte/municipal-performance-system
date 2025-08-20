// Excel服务单元测试
import { ExcelService } from '../../services/excel';
import * as XLSX from 'xlsx';

describe('ExcelService', () => {
  describe('parseExcelBuffer', () => {
    it('应该正确解析包含项目名称的Excel文件', () => {
      // 📚 知识点：创建测试用的Excel数据
      // 我们使用XLSX库创建一个简单的Excel文件用于测试
      const testData = [
        ['项目名称'], // 表头
        ['市政道路建设项目'],
        ['公园绿化工程'],
        ['污水处理厂建设']
      ];

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // 转换为Buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // 执行解析
      const result = ExcelService.parseExcelBuffer(buffer);

      // 验证结果
      expect(result.totalRows).toBe(4);
      expect(result.validRows).toBe(3); // 跳过表头行
      expect(result.projects).toEqual([
        '市政道路建设项目',
        '公园绿化工程',
        '污水处理厂建设'
      ]);
      expect(result.errors).toHaveLength(0);
    });

    it('应该跳过空行和无效行', () => {
      const testData = [
        ['项目名称'],
        ['有效项目1'],
        [''], // 空行
        [null], // null值
        ['有效项目2'],
        [''], // 另一个空行
        ['有效项目3']
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = ExcelService.parseExcelBuffer(buffer);

      expect(result.totalRows).toBe(7);
      expect(result.validRows).toBe(3);
      expect(result.projects).toEqual([
        '有效项目1',
        '有效项目2',
        '有效项目3'
      ]);
    });

    it('应该处理过长的项目名称', () => {
      const longName = 'A'.repeat(250); // 超过200字符的项目名称
      const testData = [
        ['项目名称'],
        ['正常项目'],
        [longName],
        ['另一个正常项目']
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = ExcelService.parseExcelBuffer(buffer);

      expect(result.validRows).toBe(2); // 只有两个有效项目
      expect(result.projects).toEqual(['正常项目', '另一个正常项目']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('项目名称过长');
    });

    it('应该处理空的Excel文件', () => {
      // 创建空的工作表
      const worksheet = XLSX.utils.aoa_to_sheet([]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = ExcelService.parseExcelBuffer(buffer);

      expect(result.totalRows).toBe(0);
      expect(result.validRows).toBe(0);
      expect(result.projects).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该处理损坏的Excel文件', () => {
      // 创建无效的Buffer
      const invalidBuffer = Buffer.from('这不是一个有效的Excel文件');

      const result = ExcelService.parseExcelBuffer(invalidBuffer);

      // 由于XLSX库可能会尝试解析任何内容，我们主要检查是否有错误
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Excel文件解析失败');
    });
  });

  describe('validateExcelFile', () => {
    it('应该接受有效的Excel文件', () => {
      const testData = [['项目名称'], ['测试项目']];
      const worksheet = XLSX.utils.aoa_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = ExcelService.validateExcelFile(buffer, 'test.xlsx');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝无效的文件扩展名', () => {
      const buffer = Buffer.from('test');

      const result = ExcelService.validateExcelFile(buffer, 'test.txt');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件格式不支持');
    });

    it('应该拒绝过大的文件', () => {
      // 创建一个超过10MB的Buffer
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const result = ExcelService.validateExcelFile(largeBuffer, 'test.xlsx');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小超过限制');
    });

    it('应该拒绝空文件', () => {
      const emptyBuffer = Buffer.alloc(0);

      const result = ExcelService.validateExcelFile(emptyBuffer, 'test.xlsx');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件为空');
    });

    it('应该拒绝损坏的Excel文件', () => {
      // 创建一个明显无效的Excel文件内容
      const corruptedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]); // 无效的二进制数据

      const result = ExcelService.validateExcelFile(corruptedBuffer, 'test.xlsx');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Excel文件格式无效或损坏');
    });
  });

  describe('generateParseReport', () => {
    it('应该生成正确的解析报告', () => {
      const result = {
        projects: ['项目1', '项目2'],
        totalRows: 3,
        validRows: 2,
        errors: ['第3行：项目名称为空']
      };

      const report = ExcelService.generateParseReport(result);

      expect(report).toContain('总行数: 3');
      expect(report).toContain('有效行数: 2');
      expect(report).toContain('项目数量: 2');
      expect(report).toContain('错误数量: 1');
      expect(report).toContain('第3行：项目名称为空');
    });

    it('应该生成无错误的报告', () => {
      const result = {
        projects: ['项目1', '项目2'],
        totalRows: 2,
        validRows: 2,
        errors: []
      };

      const report = ExcelService.generateParseReport(result);

      expect(report).toContain('总行数: 2');
      expect(report).toContain('有效行数: 2');
      expect(report).toContain('项目数量: 2');
      expect(report).not.toContain('错误数量');
    });
  });
});