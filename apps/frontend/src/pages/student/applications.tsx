import { Table, Tag, Card, Typography, Spin, message, Space } from 'antd';
import StudentLayout from '@/components/layouts/StudentLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { applicationApi } from '@/lib/api';

const { Title } = Typography;

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

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, pagination.limit]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationApi.list({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.code === 200) {
        setApplications(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取投递记录失败');
      }
    } catch (error: any) {
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
