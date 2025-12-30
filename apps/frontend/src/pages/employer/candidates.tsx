import { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Select, Avatar, message, Modal, Descriptions, Empty, Form, Input, DatePicker, TimePicker } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';
import { employerApi } from '@/lib/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

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
  
  // 面试弹窗相关
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [interviewForm] = Form.useForm();
  const [interviewLoading, setInterviewLoading] = useState(false);
  
  // 状态更新弹窗相关
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusForm] = Form.useForm();
  const [statusModalLoading, setStatusModalLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

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

  const handleStatusChange = (record: Candidate, status: string) => {
    setPendingStatus(status);
    setCurrentCandidate(record);
    statusForm.setFieldsValue({
      status,
      feedback: '',
      employerNote: '',
    });
    setStatusModalVisible(true);
  };

  const handleStatusSubmit = async () => {
    if (!currentCandidate) return;
    
    try {
      const values = await statusForm.validateFields();
      setStatusModalLoading(true);
      
      await employerApi.updateCandidateStatus(currentCandidate.id, {
        status: values.status,
        feedback: values.feedback || undefined,
        employerNote: values.employerNote || undefined,
      });
      
      message.success('状态更新成功');
      setStatusModalVisible(false);
      statusForm.resetFields();
      fetchCandidates();
    } catch (error: any) {
      console.error('Update status error:', error);
      if (error?.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      message.error(error.message || '更新失败');
    } finally {
      setStatusModalLoading(false);
    }
  };

  const handleCreateInterview = (record: Candidate) => {
    setCurrentCandidate(record);
    interviewForm.resetFields();
    setInterviewModalVisible(true);
  };

  const handleInterviewSubmit = async () => {
    if (!currentCandidate) return;
    
    try {
      const values = await interviewForm.validateFields();
      setInterviewLoading(true);
      
      // 合并日期和时间
      const scheduledAt = values.date
        .hour(values.time?.hour() || 9)
        .minute(values.time?.minute() || 0)
        .second(0)
        .millisecond(0)
        .toISOString();
      
      await employerApi.createInterview(currentCandidate.id, {
        scheduledAt,
        mode: values.mode,
        locationOrLink: values.locationOrLink || undefined,
        note: values.note || undefined,
      });
      
      message.success('面试邀请发送成功');
      setInterviewModalVisible(false);
      interviewForm.resetFields();
      fetchCandidates();
    } catch (error: any) {
      console.error('Create interview error:', error);
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || '创建面试邀请失败');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleViewResume = async (record: Candidate) => {
    console.log('Viewing resume for:', record.id);
    setCurrentCandidate(record);
    setViewResumeModalVisible(true);
    // 如果是首次查看，自动标记为"已查看"
    if (record.status === 'APPLIED') {
      try {
        await employerApi.updateCandidateStatus(record.id, { status: 'VIEWED' });
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
              <Button type="link" icon={<CalendarOutlined />} onClick={() => handleCreateInterview(record)}>
                发起面试
              </Button>
              <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={() => handleStatusChange(record, 'ACCEPTED')}>
                录用
              </Button>
              <Button type="link" icon={<CloseOutlined />} danger onClick={() => handleStatusChange(record, 'REJECTED')}>
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

      {/* 面试弹窗 */}
      <Modal
        title="发起面试邀请"
        open={interviewModalVisible}
        onCancel={() => {
          setInterviewModalVisible(false);
          interviewForm.resetFields();
        }}
        onOk={handleInterviewSubmit}
        confirmLoading={interviewLoading}
        width={600}
      >
        <Form form={interviewForm} layout="vertical">
          <Form.Item
            label="面试日期"
            name="date"
            rules={[{ required: true, message: '请选择面试日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item
            label="面试时间"
            name="time"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item
            label="面试方式"
            name="mode"
            rules={[{ required: true, message: '请选择面试方式' }]}
          >
            <Select>
              <Select.Option value="ONLINE">线上</Select.Option>
              <Select.Option value="OFFLINE">线下</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="面试地点/链接"
            name="locationOrLink"
            tooltip="线下面试填写地点，线上面试填写会议链接"
          >
            <Input placeholder="例如：北京市海淀区xxx / 或 https://meet.example.com/xxx" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <TextArea rows={4} placeholder="可填写面试要求、注意事项等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 状态更新弹窗 */}
      <Modal
        title={pendingStatus === 'ACCEPTED' ? '录用候选人' : '拒绝候选人'}
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          statusForm.resetFields();
        }}
        onOk={handleStatusSubmit}
        confirmLoading={statusModalLoading}
        width={600}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="反馈（学生可见）"
            name="feedback"
            tooltip="此反馈将显示给候选人"
          >
            <TextArea rows={4} placeholder={pendingStatus === 'ACCEPTED' ? '可填写录用通知、入职安排等' : '可填写拒绝原因、建议等'} />
          </Form.Item>
          <Form.Item
            label="内部备注（仅企业可见）"
            name="employerNote"
            tooltip="此备注仅企业内部可见，候选人无法查看"
          >
            <TextArea rows={3} placeholder="可填写内部评价、备注等" />
          </Form.Item>
        </Form>
      </Modal>
    </EmployerLayout>
  );
}
