import { Table, Card, Button, Space, Typography, Modal, Form, Input, Select, Switch, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/lib/api';

const { Title } = Typography;
const { TextArea } = Input;

interface RiskRule {
  id: string;
  ruleType: string;
  content: string;
  action: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminRisk() {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
  }, [pagination.page, pagination.limit]);

  // 修复依赖项警告
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await adminApi.risk.getRules({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.code === 200) {
        setRules(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取规则列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取规则列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (rule: RiskRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ruleType: rule.ruleType,
      content: rule.content,
      action: rule.action,
      enabled: rule.enabled,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await adminApi.risk.deleteRule(id);
      if (response.code === 200) {
        message.success('删除成功');
        fetchRules();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRule) {
        // 更新
        const response = await adminApi.risk.updateRule(editingRule.id, values);
        if (response.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchRules();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        // 创建
        const response = await adminApi.risk.createRule(values);
        if (response.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchRules();
        } else {
          message.error(response.message || '创建失败');
        }
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写完整信息');
      } else {
        message.error(error.message || '操作失败');
      }
    }
  };

  const getRuleTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      sensitive_word: '敏感词',
      duplicate_detection: '重复检测',
      content_quality: '内容质量',
    };
    return typeMap[type] || type;
  };

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      block: '阻止',
      mark: '标记为高风险',
    };
    return actionMap[action] || action;
  };

  const columns: ColumnsType<RiskRule> = [
    { 
      title: '规则类型', 
      dataIndex: 'ruleType', 
      key: 'ruleType',
      render: (type: string) => <Tag color="blue">{getRuleTypeText(type)}</Tag>,
    },
    { 
      title: '规则内容', 
      dataIndex: 'content', 
      key: 'content',
      ellipsis: true,
    },
    { 
      title: '处理动作', 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => {
        const colorMap: Record<string, string> = {
          block: 'red',
          mark: 'orange',
        };
        return <Tag color={colorMap[action]}>{getActionText(action)}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link"
            onClick={async () => {
              try {
                const response = await adminApi.risk.updateRule(record.id, { enabled: !record.enabled });
                if (response.code === 200) {
                  message.success(record.enabled ? '已禁用' : '已启用');
                  fetchRules();
                } else {
                  message.error(response.message || '操作失败');
                }
              } catch (error: any) {
                message.error(error.message || '操作失败');
              }
            }}
          >
            {record.enabled ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这条规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>风控规则管理 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>风控规则管理</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建规则
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={rules} 
          rowKey="id"
          loading={loading}
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
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
          }}
        >
          <Form.Item
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="请选择规则类型">
              <Select.Option value="sensitive_word">敏感词</Select.Option>
              <Select.Option value="duplicate_detection">重复检测</Select.Option>
              <Select.Option value="content_quality">内容质量</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="规则内容"
            rules={[{ required: true, message: '请输入规则内容' }]}
            extra="敏感词规则：多个关键词用 | 分隔，如：传销|诈骗|非法"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入规则内容..."
            />
          </Form.Item>

          <Form.Item
            name="action"
            label="处理动作"
            rules={[{ required: true, message: '请选择处理动作' }]}
          >
            <Select placeholder="请选择处理动作">
              <Select.Option value="block">阻止（不允许提交，明确告知敏感词）</Select.Option>
              <Select.Option value="mark">标记为高风险（允许提交，审核时优先处理）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="enabled"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}

