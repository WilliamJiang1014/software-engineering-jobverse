import { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Modal, message, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';
import { employerApi } from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Job {
  id: string;
  title: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  status: string;
  _count?: { applications: number };
  createdAt: string;
  description?: string;
  requirements?: string;
  tags?: string[];
}

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  PENDING_REVIEW: { color: 'processing', text: '待审核' },
  APPROVED: { color: 'success', text: '已发布' },
  REJECTED: { color: 'error', text: '已驳回' },
  OFFLINE: { color: 'default', text: '已下线' },
};

export default function EmployerJobs() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form] = Form.useForm();

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('Fetching jobs...');
      const res: any = await employerApi.getJobs({ page, limit: 10 });
      if (res.code === 200) {
        setJobs(res.data.items);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch jobs error:', error);
      message.error('获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const handleSubmitReview = async (id: string) => {
    Modal.confirm({
      title: '提交审核',
      content: '确定要提交该岗位进行审核吗？',
      onOk: async () => {
        try {
          await employerApi.submitJob(id);
          message.success('已提交审核');
          fetchJobs();
        } catch (error) {
          message.error('提交失败');
        }
      },
    });
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const handleDeleteClick = (id: string) => {
    setJobToDelete(id);
    setDeleteModalVisible(true);
    setPassword('');
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete || !password) {
      message.error('请输入密码');
      return;
    }
    try {
      await employerApi.deleteJob(jobToDelete, password);
      message.success('岗位已删除');
      setDeleteModalVisible(false);
      fetchJobs();
    } catch (error: any) {
      message.error(error.message || '删除失败，请检查密码');
    }
  };

  const handleEdit = (record: Job) => {
    setEditingJob(record);
    form.setFieldsValue({
      ...record,
      tags: record.tags || [],
    });
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingJob) {
        await employerApi.updateJob(editingJob.id, values);
        message.success('更新成功');
      } else {
        await employerApi.createJob(values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      fetchJobs();
    } catch (error: any) {
      console.error('Submit job error:', error);
      message.error(error.message || '操作失败');
    }
  };

  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title' },
    { 
      title: '薪资', 
      key: 'salary',
      render: (_, record) => `${record.salaryMin || 0}-${record.salaryMax || 0}`
    },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.text || status}</Tag>
      )
    },
    { 
      title: '投递数', 
      key: 'applications',
      render: (_, record) => record._count?.applications || 0
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteClick(record.id)}>删除</Button>
          {(record.status === 'DRAFT' || record.status === 'REJECTED') && (
            <Button type="link" icon={<SendOutlined />} onClick={() => handleSubmitReview(record.id)}>
              提交审核
            </Button>
          )}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>发布新岗位</Button>
      </div>
      
      <Card style={{ marginTop: 16 }}>
        <Table 
          columns={columns} 
          dataSource={jobs} 
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        okButtonProps={{ danger: true }}
      >
        <p>删除岗位不可恢复，请输入密码确认：</p>
        <Input.Password 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="请输入登录密码" 
        />
      </Modal>

      <Modal
        title={editingJob ? '编辑岗位' : '发布新岗位'}
        open={isModalVisible}
        onOk={handleModalOk}
        confirmLoading={submitLoading}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space>
            <Form.Item name="salaryMin" label="最低薪资" rules={[{ required: true }]}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="salaryMax" label="最高薪资" rules={[{ required: true }]}>
              <InputNumber min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="location" label="工作地点" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签按回车" />
          </Form.Item>
          <Form.Item name="description" label="职位描述">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </EmployerLayout>
  );
}

