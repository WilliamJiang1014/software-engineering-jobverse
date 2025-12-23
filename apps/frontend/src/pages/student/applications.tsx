import { Table, Tag, Card, Typography, Spin, message, Space, Select, Radio } from 'antd';
import StudentLayout from '@/components/layouts/StudentLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { applicationApi } from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

interface Application {
  id: string;
  jobId: string;
  job: {
    id: string;
    title: string;
    location: string;
    company: {
      id: string;
      name: string;
      verifiedBySchool: boolean;
    };
  };
  status: string;
  appliedAt: string;
  updatedAt: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'processing', text: '已投递' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'blue', text: '面试中' },
  ACCEPTED: { color: 'success', text: '已录用' },
  REJECTED: { color: 'error', text: '不合适' },
};

export default function StudentApplications() {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // 根据筛选条件添加参数
      if (statusFilter === 'in_progress') {
        params.statusGroup = 'in_progress';
      } else if (statusFilter === 'completed') {
        params.statusGroup = 'completed';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('Fetching applications with params:', params); // 调试日志

      const response = await applicationApi.list(params);
      if (response.code === 200) {
        setApplications(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取投递记录失败');
      }
    } catch (error: any) {
      console.error('获取投递记录失败:', error);
      message.error(error.message || '获取投递记录失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Application> = [
    { 
      title: '岗位名称', 
      key: 'jobTitle',
      render: (_, record) => (
        <a href={`/jobs/${record.jobId}`}>{record.job.title}</a>
      ),
    },
    { 
      title: '公司', 
      key: 'company',
      render: (_, record) => (
        <Space>
          <span>{record.job.company.name}</span>
          {record.job.company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
        </Space>
      ),
    },
    { title: '工作地点', key: 'location', render: (_, record) => record.job.location },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
      )
    },
    { 
      title: '投递时间', 
      dataIndex: 'appliedAt', 
      key: 'appliedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <StudentLayout>
      <Head>
        <title>我的投递 - JobVerse</title>
      </Head>

      <Title level={4}>我的投递</Title>
      
      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>状态筛选：</span>
            <Radio.Group 
              value={statusFilter} 
              onChange={(e) => {
                const newFilter = e.target.value;
                setStatusFilter(newFilter);
                // 重置到第一页
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <Radio.Button value="all">全部</Radio.Button>
              <Radio.Button value="in_progress">进行中</Radio.Button>
              <Radio.Button value="completed">已完成</Radio.Button>
              <Radio.Button value="APPLIED">已投递</Radio.Button>
              <Radio.Button value="VIEWED">已查看</Radio.Button>
              <Radio.Button value="INTERVIEWING">面试中</Radio.Button>
              <Radio.Button value="ACCEPTED">已录用</Radio.Button>
              <Radio.Button value="REJECTED">不合适</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={applications} 
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, page, limit: pageSize });
              },
            }}
          />
        </Spin>
      </Card>
    </StudentLayout>
  );
}
