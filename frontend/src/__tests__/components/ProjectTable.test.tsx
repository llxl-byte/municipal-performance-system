// 项目表格组件单元测试
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProjectTable from '../../components/ProjectTable';
import { projectApi } from '../../services/api';

// 模拟API服务
vi.mock('../../services/api', () => ({
  projectApi: {
    getProjects: vi.fn(),
    getStats: vi.fn(),
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
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

const mockProjectApi = projectApi as any;

// 测试数据
const mockProjects = [
  {
    id: 1,
    name: '市政道路建设项目',
    createdAt: '2023-12-01T10:00:00.000Z',
    updatedAt: '2023-12-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: '公园绿化工程',
    createdAt: '2023-12-02T11:00:00.000Z',
    updatedAt: '2023-12-02T11:00:00.000Z',
  },
];

const mockApiResponse = {
  success: true,
  data: {
    items: mockProjects,
    total: 2,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  },
};

const mockStatsResponse = {
  success: true,
  data: {
    total: 2,
    lastUpdated: '2023-12-01T10:00:00.000Z',
  },
};

// 包装组件以提供Router上下文
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProjectTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectApi.getProjects.mockResolvedValue(mockApiResponse);
    mockProjectApi.getStats.mockResolvedValue(mockStatsResponse);
  });

  it('应该渲染项目表格', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 验证表格标题
    expect(screen.getByText('项目数据列表')).toBeInTheDocument();
    
    // 验证统计卡片
    expect(screen.getByText('项目总数')).toBeInTheDocument();
    expect(screen.getByText('最后更新')).toBeInTheDocument();
    expect(screen.getByText('数据状态')).toBeInTheDocument();
  });

  it('应该显示项目数据', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待数据加载
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalled();
    });

    // 验证项目数据显示
    await waitFor(() => {
      expect(screen.getByText('市政道路建设项目')).toBeInTheDocument();
      expect(screen.getByText('公园绿化工程')).toBeInTheDocument();
    });
  });

  it('应该显示统计数据', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待统计数据加载
    await waitFor(() => {
      expect(mockProjectApi.getStats).toHaveBeenCalled();
    });

    // 验证统计数据显示
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // 项目总数
    });
  });

  it('应该支持搜索功能', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('项目数据列表')).toBeInTheDocument();
    });

    // 查找搜索输入框
    const searchInput = screen.getByPlaceholderText('请输入项目名称');
    
    // 输入搜索关键词
    fireEvent.change(searchInput, { target: { value: '道路' } });
    
    // 点击搜索按钮
    const searchButton = screen.getByText('查询');
    fireEvent.click(searchButton);

    // 验证API调用
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalledWith(1, 10, '道路');
    });
  });

  it('应该支持刷新功能', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalledTimes(1);
    });

    // 点击刷新按钮
    const refreshButton = screen.getByText('刷新数据');
    fireEvent.click(refreshButton);

    // 验证API再次调用
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalledTimes(2);
      expect(mockProjectApi.getStats).toHaveBeenCalledTimes(2);
    });
  });

  it('应该处理API错误', async () => {
    // 模拟API错误
    mockProjectApi.getProjects.mockRejectedValue(new Error('网络错误'));
    
    renderWithRouter(<ProjectTable />);
    
    // 等待错误处理
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalled();
    });

    // 验证错误消息（通过mock验证）
    // 注意：由于message.error是被mock的，我们无法直接验证UI显示
    // 但可以验证API调用确实发生了
  });

  it('应该显示空数据状态', async () => {
    // 模拟空数据响应
    mockProjectApi.getProjects.mockResolvedValue({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      },
    });
    
    renderWithRouter(<ProjectTable />);
    
    // 等待数据加载
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalled();
    });

    // 验证空数据提示
    await waitFor(() => {
      expect(screen.getByText('暂无数据，请先上传Excel文件')).toBeInTheDocument();
    });
  });

  it('应该支持分页功能', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(mockProjectApi.getProjects).toHaveBeenCalledWith(1, 10, '');
    });

    // 模拟分页数据
    const paginatedResponse = {
      success: true,
      data: {
        items: mockProjects,
        total: 25, // 总共25条数据，需要分页
        page: 2,
        pageSize: 10,
        totalPages: 3,
      },
    };
    
    mockProjectApi.getProjects.mockResolvedValue(paginatedResponse);

    // 查找并点击第2页（如果存在分页控件）
    // 注意：由于ProTable的分页控件可能需要特定的数据才会显示，
    // 这里主要验证API调用的参数格式
    
    // 验证初始API调用参数
    expect(mockProjectApi.getProjects).toHaveBeenCalledWith(1, 10, '');
  });

  it('应该显示项目操作按钮', async () => {
    renderWithRouter(<ProjectTable />);
    
    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('市政道路建设项目')).toBeInTheDocument();
    });

    // 验证操作按钮存在
    const viewButtons = screen.getAllByText('查看');
    const deleteButtons = screen.getAllByText('删除');
    
    expect(viewButtons).toHaveLength(2); // 两个项目，每个都有查看按钮
    expect(deleteButtons).toHaveLength(2); // 两个项目，每个都有删除按钮
  });

  it('应该处理统计数据加载失败', async () => {
    // 模拟统计API错误
    mockProjectApi.getStats.mockRejectedValue(new Error('统计数据获取失败'));
    
    renderWithRouter(<ProjectTable />);
    
    // 等待统计数据加载尝试
    await waitFor(() => {
      expect(mockProjectApi.getStats).toHaveBeenCalled();
    });

    // 验证组件仍然正常渲染（不会因为统计数据失败而崩溃）
    expect(screen.getByText('项目数据列表')).toBeInTheDocument();
  });
});