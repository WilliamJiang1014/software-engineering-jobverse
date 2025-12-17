import { Table, Tag, Card, Button, Space, Typography, Select, Avatar } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Candidate {
  id: string;
  name: string;
  jobTitle: string;
  school: string;
  status: string;
  appliedAt: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待处理' },
  VIEWED: { color: 'warning', text: '已查看' },
  ACCEPTED: { color: 'success', text: '已通过' },
  REJECTED: { color: 'error', text: '已拒绝' },
};

// 模拟数据
const mockCandidates: Candidate[] = [
  { id: '1', name: '张三', jobTitle: '前端开发工程师', school: '清华大学', status: 'PENDING', appliedAt: '2025-12-15 10:30' },
  { id: '2', name: '李四', jobTitle: '后端开发工程师', school: '北京大学', status: 'VIEWED', appliedAt: '2025-12-14 14:20' },
  { id: '3', name: '王五', jobTitle: '产品经理', school: '浙江大学', status: 'ACCEPTED', appliedAt: '2025-12-13 16:45' },
  { id: '4', name: '赵六', jobTitle: '前端开发工程师', school: '上海交通大学', status: 'REJECTED', appliedAt: '2025-12-12 11:00' },
  { id: '5', name: '钱七', jobTitle: '后端开发工程师', school: '复旦大学', status: 'PENDING', appliedAt: '2025-12-11 09:15' },
];

export default function EmployerCandidates() {
  const columns: ColumnsType<Candidate> = [
    { 
      title: '候选人', 
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          {record.name}
        </Space>
      )
    },
    { title: '应聘岗位', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: '学校', dataIndex: 'school', key: 'school' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      )
    },
    { title: '投递时间', dataIndex: 'appliedAt', key: 'appliedAt' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link">查看简历</Button>
          {record.status === 'PENDING' && (
            <>
              <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>通过</Button>
              <Button type="link" icon={<CloseOutlined />} danger>拒绝</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <EmployerLayout>
      <Head>
        <title>候选人管理 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>候选人管理</Title>
        <Space>
          <Select placeholder="筛选岗位" style={{ width: 200 }} allowClear>
            <Select.Option value="1">前端开发工程师</Select.Option>
            <Select.Option value="2">后端开发工程师</Select.Option>
            <Select.Option value="3">产品经理</Select.Option>
          </Select>
          <Select placeholder="筛选状态" style={{ width: 120 }} allowClear>
            <Select.Option value="PENDING">待处理</Select.Option>
            <Select.Option value="VIEWED">已查看</Select.Option>
            <Select.Option value="ACCEPTED">已通过</Select.Option>
            <Select.Option value="REJECTED">已拒绝</Select.Option>
          </Select>
        </Space>
      </div>
      
      <Card style={{ marginTop: 16 }}>
        <Table 
          columns={columns} 
          dataSource={mockCandidates} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </EmployerLayout>
  );
}

