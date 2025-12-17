import { Table, Tag, Card, Button, Space, Typography, Modal, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;

interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  submittedAt: string;
}

// 模拟数据
const mockPendingJobs: Job[] = [
  { id: '1', title: 'UI设计师', company: 'XX科技有限公司', salary: '12K-20K', location: '北京', submittedAt: '2025-12-15 10:30' },
  { id: '2', title: '数据分析师', company: 'YY互联网公司', salary: '18K-28K', location: '上海', submittedAt: '2025-12-15 09:20' },
  { id: '3', title: '运营专员', company: 'ZZ创新科技', salary: '10K-15K', location: '深圳', submittedAt: '2025-12-14 16:45' },
];

export default function AdminReview() {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (job: Job) => {
    Modal.confirm({
      title: '审核通过',
      content: `确定要通过「${job.title}」的审核吗？`,
      onOk: () => {
        message.success('审核已通过');
      },
    });
  };

  const handleReject = (job: Job) => {
    setSelectedJob(job);
    setRejectModalVisible(true);
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      message.error('请输入驳回原因');
      return;
    }
    message.success('已驳回');
    setRejectModalVisible(false);
    setRejectReason('');
    setSelectedJob(null);
  };

  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title' },
    { title: '企业', dataIndex: 'company', key: 'company' },
    { title: '薪资', dataIndex: 'salary', key: 'salary' },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>查看详情</Button>
          <Button 
            type="link" 
            icon={<CheckOutlined />} 
            style={{ color: '#52c41a' }}
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button 
            type="link" 
            icon={<CloseOutlined />} 
            danger
            onClick={() => handleReject(record)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>岗位审核 - JobVerse</title>
      </Head>

      <Title level={4}>岗位审核</Title>
      <div style={{ marginBottom: 16 }}>
        <Tag color="warning">待审核: {mockPendingJobs.length}</Tag>
      </div>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={mockPendingJobs} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="驳回岗位"
        open={rejectModalVisible}
        onOk={submitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <p>岗位：{selectedJob?.title}</p>
        <p>企业：{selectedJob?.company}</p>
        <TextArea
          placeholder="请输入驳回原因..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
        />
      </Modal>
    </AdminLayout>
  );
}

