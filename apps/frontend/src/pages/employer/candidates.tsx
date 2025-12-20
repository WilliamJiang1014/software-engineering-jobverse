import { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Select, Avatar, message, Modal, Descriptions, Empty } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';
import { employerApi } from '@/lib/api';

const { Title } = Typography;

interface Candidate {
  id: string; // Application ID
  status: string;
  appliedAt: string;
  resume?: string;
  coverLetter?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
}

interface JobOption {
  id: string;
  title: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'default', text: '已投递' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'processing', text: '面试中' },
  ACCEPTED: { color: 'success', text: '已录用' },
  REJECTED: { color: 'error', text: '不合适' },
};

export default function EmployerCandidates() {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewResumeModalVisible, setViewResumeModalVisible] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);

  // 1. 获取所有岗位
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res: any = await employerApi.getJobs({ page: 1, limit: 100 });
        if (res.code === 200) {
          const allJobs = [{ id: 'ALL', title: '全部岗位' }, ...res.data.items];
          setJobs(allJobs);
          setSelectedJobId('ALL'); // 默认选中全部
        }
      } catch (error) {
        message.error('获取岗位列表失败');
      }
    };
    fetchJobs();
  }, []);

  // 2. 获取候选人
  useEffect(() => {
    if (!selectedJobId) return;
    fetchCandidates();
  }, [selectedJobId]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let res: any;
      if (selectedJobId === 'ALL') {
        res = await employerApi.getAllCandidates();
      } else {
        res = await employerApi.getCandidates(selectedJobId);
      }

      if (res.code === 200) {
        setCandidates(res.data.items);
      }
    } catch (error: any) {
      console.error('Fetch candidates error:', error);
      message.error(error.message || '获取候选人失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await employerApi.updateCandidateStatus(id, status);
      message.success('状态更新成功');
      fetchCandidates();
    } catch (error: any) {
      console.error('Update status error:', error);
      message.error(error.message || '更新失败');
    }
  };

  const handleViewResume = async (record: Candidate) => {
    console.log('Viewing resume for:', record.id);
    setCurrentCandidate(record);
    setViewResumeModalVisible(true);
    // 如果是首次查看，自动标记为“已查看”
    if (record.status === 'APPLIED') {
      try {
        await employerApi.updateCandidateStatus(record.id, 'VIEWED');
        // 局部更新状态，避免重新加载整个列表
        setCandidates(prev => prev.map(c => 
          c.id === record.id ? { ...c, status: 'VIEWED' } : c
        ));
      } catch (error) {
        console.error('Auto update status error:', error);
      }
    }
  };

  const columns: ColumnsType<Candidate> = [
    { 
      title: '候选人', 
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.user.avatar} />
          <div>
            <div>{record.user.name || '未命名'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.user.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: '投递岗位',
      key: 'job',
      render: (_, record) => (record as any).job?.title || '-'
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.text || status}</Tag>
      )
    },
    { 
      title: '投递时间', 
      dataIndex: 'appliedAt', 
      key: 'appliedAt',
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewResume(record)}>查看简历</Button>
          {record.status !== 'ACCEPTED' && record.status !== 'REJECTED' && (
            <>
              <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={() => handleStatusChange(record.id, 'ACCEPTED')}>
                录用
              </Button>
              <Button type="link" icon={<CloseOutlined />} danger onClick={() => handleStatusChange(record.id, 'REJECTED')}>
                拒绝
              </Button>
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
          <Select 
            placeholder="筛选岗位" 
            style={{ width: 200 }} 
            value={selectedJobId}
            onChange={setSelectedJobId}
          >
            {jobs.map(job => (
              <Select.Option key={job.id} value={job.id}>{job.title}</Select.Option>
            ))}
          </Select>
        </Space>
      </div>
      
      <Card style={{ marginTop: 16 }}>
        <Table 
          columns={columns} 
          dataSource={candidates} 
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无投递记录' }}
        />
      </Card>

      <Modal
        title="简历详情"
        open={viewResumeModalVisible}
        onCancel={() => setViewResumeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewResumeModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentCandidate ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="姓名">{currentCandidate.user.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentCandidate.user.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentCandidate.user.email}</Descriptions.Item>
            <Descriptions.Item label="求职信">
              <div style={{ whiteSpace: 'pre-wrap' }}>{currentCandidate.coverLetter || '无求职信'}</div>
            </Descriptions.Item>
            <Descriptions.Item label="在线简历">
              {currentCandidate.resume ? (
                currentCandidate.resume.startsWith('http') ? (
                  <a href={currentCandidate.resume} target="_blank" rel="noopener noreferrer">
                    点击查看/下载简历
                  </a>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    {currentCandidate.resume}
                  </div>
                )
              ) : (
                <Empty description="未上传在线简历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty />
        )}
      </Modal>
    </EmployerLayout>
  );
}
