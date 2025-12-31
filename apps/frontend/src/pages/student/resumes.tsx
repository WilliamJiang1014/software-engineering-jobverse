import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Typography, Card, Button, Table, Tag, Space, Modal, Form, Input, 
  Checkbox, message, Popconfirm, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, 
  FileTextOutlined, StarOutlined, StarFilled 
} from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { resumeApi } from '@/lib/api';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Resume {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ResumeCenter() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res: any = await resumeApi.list();
      setResumes(res.data || []);
    } catch (error) {
      message.error('获取简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleAdd = () => {
    setEditingResume(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Resume) => {
    setEditingResume(record);
    form.setFieldsValue({
      name: record.name,
      content: record.content,
      isDefault: record.isDefault,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      message.success('删除成功');
      fetchResumes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSetDefault = async (record: Resume) => {
    if (record.isDefault) return;
    try {
      await resumeApi.setDefault(record.id);
      message.success('已设置为默认简历');
      fetchResumes();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingResume) {
        await resumeApi.update(editingResume.id, values);
        message.success('更新成功');
      } else {
        await resumeApi.create(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchResumes();
    } catch (error) {
      // Form validation error or API error
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '简历名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Resume) => (
        <Space>
          <FileTextOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.isDefault && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Resume) => (
        <Space size="middle">
          <Tooltip title={record.isDefault ? "默认简历" : "设为默认"}>
            <Button 
              type="text" 
              icon={record.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
              onClick={() => handleSetDefault(record)}
              disabled={record.isDefault}
            />
          </Tooltip>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这份简历吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <StudentLayout>
      <Head>
        <title>简历管理 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4}>我的简历</Title>
          <Paragraph type="secondary">管理你的在线简历，投递时可直接选择使用</Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建简历
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={resumes}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingResume ? "编辑简历" : "创建简历"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isDefault: false }}
        >
          <Form.Item
            name="name"
            label="简历名称"
            rules={[{ required: true, message: '请输入简历名称' }]}
          >
            <Input placeholder="例如：Java开发工程师简历" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="简历内容"
            rules={[{ required: true, message: '请输入简历内容' }]}
            extra="支持 Markdown 格式，或者直接粘贴简历链接"
          >
            <TextArea rows={10} placeholder="请输入简历详细内容..." />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>设为默认简历</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </StudentLayout>
  );
}
