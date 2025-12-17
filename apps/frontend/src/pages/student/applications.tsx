import { Table, Tag, Card, Typography } from 'antd';
import StudentLayout from '@/components/layouts/StudentLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  viewedAt?: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待查看' },
  VIEWED: { color: 'warning', text: '已查看' },
  REJECTED: { color: 'error', text: '未通过' },
  ACCEPTED: { color: 'success', text: '已通过' },
  WITHDRAWN: { color: 'default', text: '已撤回' },
};

// 模拟数据
const mockApplications: Application[] = [
  { id: '1', jobTitle: '前端开发工程师', company: 'XX科技有限公司', status: 'PENDING', appliedAt: '2025-12-15 10:30' },
  { id: '2', jobTitle: '后端开发工程师', company: 'YY互联网公司', status: 'VIEWED', appliedAt: '2025-12-14 14:20', viewedAt: '2025-12-15 09:00' },
  { id: '3', jobTitle: '产品经理', company: 'ZZ创新科技', status: 'REJECTED', appliedAt: '2025-12-13 16:45' },
  { id: '4', jobTitle: 'Java开发工程师', company: 'AA科技', status: 'ACCEPTED', appliedAt: '2025-12-10 11:00' },
  { id: '5', jobTitle: 'AI算法工程师', company: 'BB人工智能', status: 'PENDING', appliedAt: '2025-12-09 15:30' },
  { id: '6', jobTitle: 'UI设计师', company: 'CC设计', status: 'WITHDRAWN', appliedAt: '2025-12-08 09:15' },
];

const columns: ColumnsType<Application> = [
  { title: '岗位名称', dataIndex: 'jobTitle', key: 'jobTitle' },
  { title: '公司', dataIndex: 'company', key: 'company' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status',
    render: (status: string) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    )
  },
  { title: '投递时间', dataIndex: 'appliedAt', key: 'appliedAt' },
  { title: '查看时间', dataIndex: 'viewedAt', key: 'viewedAt', render: (v) => v || '-' },
];

export default function StudentApplications() {
  return (
    <StudentLayout>
      <Head>
        <title>我的投递 - JobVerse</title>
      </Head>

      <Title level={4}>我的投递</Title>
      
      <Card style={{ marginTop: 16 }}>
        <Table 
          columns={columns} 
          dataSource={mockApplications} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </StudentLayout>
  );
}

