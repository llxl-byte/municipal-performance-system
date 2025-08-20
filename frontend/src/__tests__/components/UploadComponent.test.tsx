// 上传组件单元测试
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UploadComponent from '../../components/UploadComponent';
import { uploadApi } from '../../services/api';

// 模拟API服务
vi.mock('../../services/api', () => ({
  uploadApi: {
    uploadFile: vi.fn(),
  },
}));

// 模拟antd的message组件
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

const mockUploadApi = uploadApi as any;

describe('UploadComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染上传组件', () => {
    render(<UploadComponent />);
    
    expect(screen.getByText('点击或拖拽Excel文件到此区域上传')).toBeInTheDocument();
    expect(screen.getByText(/支持.xlsx和.xls格式/)).toBeInTheDocument();
  });

  it('应该显示自定义的最大文件大小', () => {
    render(<UploadComponent maxFileSize={5} />);
    
    expect(screen.getByText(/文件大小不超过5MB/)).toBeInTheDocument();
  });

  it('应该在禁用状态下禁用上传', () => {
    render(<UploadComponent disabled={true} />);
    
    const uploadArea = screen.getByRole('button');
    expect(uploadArea).toHaveAttribute('disabled');
  });

  it('应该验证Excel文件格式', async () => {
    const onUploadError = vi.fn();
    render(<UploadComponent onUploadError={onUploadError} />);

    // 创建一个非Excel文件
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    // 模拟文件选择
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('只能上传Excel文件(.xlsx, .xls)！');
    });
  });

  it('应该验证文件大小', async () => {
    const onUploadError = vi.fn();
    render(<UploadComponent maxFileSize={1} onUploadError={onUploadError} />);

    // 创建一个超过1MB的Excel文件
    const largeContent = new Array(2 * 1024 * 1024).fill('a').join(''); // 2MB
    const file = new File([largeContent], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('文件大小不能超过1MB！');
    });
  });

  it('应该成功上传Excel文件', async () => {
    const mockResponse = {
      success: true,
      data: {
        file: {
          name: 'test.xlsx',
          size: 1024,
        },
        parsing: {
          totalRows: 10,
          validRows: 8,
        },
        import: {
          insertedRows: 5,
          duplicateRows: 3,
        },
        summary: {
          message: '上传成功',
        },
      },
    };

    mockUploadApi.uploadFile.mockResolvedValue(mockResponse);
    
    const onUploadSuccess = vi.fn();
    render(<UploadComponent onUploadSuccess={onUploadSuccess} />);

    // 创建一个有效的Excel文件
    const file = new File(['excel content'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockUploadApi.uploadFile).toHaveBeenCalledWith(file);
      expect(onUploadSuccess).toHaveBeenCalledWith(mockResponse.data);
    });

    // 验证结果显示
    expect(screen.getByText('上传成功')).toBeInTheDocument();
    expect(screen.getByText('新增项目')).toBeInTheDocument();
    expect(screen.getByText('重复项目')).toBeInTheDocument();
  });

  it('应该处理上传失败', async () => {
    const mockError = new Error('网络错误');
    mockUploadApi.uploadFile.mockRejectedValue(mockError);
    
    const onUploadError = vi.fn();
    render(<UploadComponent onUploadError={onUploadError} />);

    const file = new File(['excel content'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('网络错误');
    });

    // 验证错误显示
    expect(screen.getByText('上传失败')).toBeInTheDocument();
    expect(screen.getByText('网络错误')).toBeInTheDocument();
  });

  it('应该支持重置上传', async () => {
    const mockResponse = {
      success: true,
      data: {
        file: { name: 'test.xlsx', size: 1024 },
        parsing: { totalRows: 10, validRows: 8 },
        import: { insertedRows: 5, duplicateRows: 3 },
        summary: { message: '上传成功' },
      },
    };

    mockUploadApi.uploadFile.mockResolvedValue(mockResponse);
    
    render(<UploadComponent />);

    // 先上传一个文件
    const file = new File(['excel content'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('上传成功')).toBeInTheDocument();
    });

    // 点击重新上传按钮
    const resetButton = screen.getByText('重新上传');
    fireEvent.click(resetButton);

    // 验证结果被清除
    expect(screen.queryByText('上传成功')).not.toBeInTheDocument();
  });

  it('应该在不显示结果时隐藏结果区域', async () => {
    const mockResponse = {
      success: true,
      data: {
        file: { name: 'test.xlsx', size: 1024 },
        parsing: { totalRows: 10, validRows: 8 },
        import: { insertedRows: 5, duplicateRows: 3 },
        summary: { message: '上传成功' },
      },
    };

    mockUploadApi.uploadFile.mockResolvedValue(mockResponse);
    
    render(<UploadComponent showResult={false} />);

    const file = new File(['excel content'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockUploadApi.uploadFile).toHaveBeenCalled();
    });

    // 验证结果不显示
    expect(screen.queryByText('上传成功')).not.toBeInTheDocument();
    expect(screen.queryByText('新增项目')).not.toBeInTheDocument();
  });
});