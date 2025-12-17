import { Table, Tag, Card, Button, Space, Typography, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  status: string;
  applications: number;
  createdAt: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  PENDING: { color: 'processing', text: '待审核' },
  APPROVED: { color: 'success', text: '已发布' },
  REJECTED: { color: 'error', text: '已驳回' },
  CLOSED: { color: 'default', text: '已关闭' },
};

// 模拟数据
const mockJobs: Job[] = [
  { id: '1', title: '前端开发工程师', salary: '15K-25K', location: '北京', status: 'APPROVED', applications: 15, createdAt: '2025-12-10' },
  { id: '2', title: '后端开发工程师', salary: '18K-30K', location: '北京', status: 'APPROVED', applications: 8, createdAt: '2025-12-09' },
  { id: '3', title: '产品经理', salary: '20K-35K', location: '北京', status: 'PENDING', applications: 0, createdAt: '2025-12-15' },
  { id: '4', title: 'UI设计师', salary: '12K-20K', location: '北京', status: 'DRAFT', applications: 0, createdAt: '2025-12-14' },
  { id: '5', title: '数据分析师', salary: '18K-28K', location: '北京', status: 'REJECTED', applications: 0, createdAt: '2025-12-08' },
];

export default function EmployerJobs() {
  const handleSubmitReview = (id: string) => {
    Modal.confirm({
      title: '提交审核',
      content: '确定要提交该岗位进行审核吗？',
      onOk: () => {
        message.success('已提交审核');
      },
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '删除岗位',
      content: '确定要删除该岗位吗？此操作不可恢复。',
      okType: 'danger',
      onOk: () => {
        message.success('删除成功');
      },
    });
  };

  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title' },
    { title: '薪资', dataIndex: 'salary', key: 'salary' },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      )
    },
    { title: '投递数', dataIndex: 'applications', key: 'applications' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          {record.status === 'DRAFT' && (
            <Button type="link" icon={<SendOutlined />} onClick={() => handleSubmitReview(record.id)}>
              提交审核
            </Button>
          )}
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <EmployerLayout>
      <Head>
        <title>岗位管理 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>岗位管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>发布新岗位</Button>
      </div>
      
      <Card style={{ marginTop: 16 }}>
        <Table 
          columns={columns} 
          dataSource={mockJobs} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </EmployerLayout>
  );
}

