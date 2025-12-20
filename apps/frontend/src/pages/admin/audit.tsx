import { Table, Card, Tag, Space, Typography, Select, Input, Button, Modal, Descriptions, message, Spin } from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminAudit() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, pagination.limit, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.action) params.action = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;

      const response = await adminApi.audit.getLogs(params);
      if (response.code === 200) {
        setLogs(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取审计日志失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (log: AuditLog) => {
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const response = await adminApi.audit.getLogDetail(log.id);
      if (response.code === 200) {
        setSelectedLog(response.data);
      } else {
        message.error(response.message || '获取日志详情失败');
        setDetailModalVisible(false);
      }
    } catch (error: any) {
      message.error(error.message || '获取日志详情失败');
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'JOB_APPROVE': '审核通过',
      'JOB_REJECT': '审核驳回',
      'JOB_CREATE': '创建岗位',
      'JOB_UPDATE': '更新岗位',
      'JOB_DELETE': '删除岗位',
      'COMPANY_VERIFY': '认证企业',
      'COMPANY_UNVERIFY': '取消认证',
      'USER_LOGIN': '用户登录',
      'USER_REGISTER': '用户注册',
      'RISK_RULE_CREATE': '创建风控规则',
      'RISK_RULE_UPDATE': '更新风控规则',
      'RISK_RULE_DELETE': '删除风控规则',
    };
    return actionMap[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE') || action.includes('VERIFY')) return 'success';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('UNVERIFY')) return 'error';
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'blue';
    if (action.includes('UPDATE')) return 'orange';
    return 'default';
  };

  const formatResourceName = (log: AuditLog) => {
    if (log.details?.title) return log.details.title;
    if (log.details?.name) return log.details.name;
    if (log.resourceId) return log.resourceId;
    return '未知';
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{formatActionText(action)}</Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
    {
      title: '资源名称',
      key: 'resourceName',
      render: (_, record) => formatResourceName(record),
    },
    {
      title: '操作人',
      key: 'user',
      width: 150,
      render: (_, record) => record.user?.name || record.user?.email || '系统',
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>审计日志 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>审计日志</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchLogs}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="操作类型"
            style={{ width: 150 }}
            allowClear
            value={filters.action || undefined}
            onChange={(value) => setFilters({ ...filters, action: value || '' })}
          >
            <Option value="JOB_APPROVE">审核通过</Option>
            <Option value="JOB_REJECT">审核驳回</Option>
            <Option value="JOB_CREATE">创建岗位</Option>
            <Option value="JOB_UPDATE">更新岗位</Option>
            <Option value="JOB_DELETE">删除岗位</Option>
            <Option value="COMPANY_VERIFY">认证企业</Option>
            <Option value="COMPANY_UNVERIFY">取消认证</Option>
            <Option value="USER_LOGIN">用户登录</Option>
            <Option value="USER_REGISTER">用户注册</Option>
            <Option value="RISK_RULE_CREATE">创建风控规则</Option>
            <Option value="RISK_RULE_UPDATE">更新风控规则</Option>
            <Option value="RISK_RULE_DELETE">删除风控规则</Option>
          </Select>

          <Select
            placeholder="资源类型"
            style={{ width: 150 }}
            allowClear
            value={filters.resourceType || undefined}
            onChange={(value) => setFilters({ ...filters, resourceType: value || '' })}
          >
            <Option value="JOB">岗位</Option>
            <Option value="COMPANY">企业</Option>
            <Option value="USER">用户</Option>
            <Option value="RISK_RULE">风控规则</Option>
          </Select>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchLogs}
            loading={loading}
          >
            查询
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={logs}
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

      <Modal
        title="审计日志详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedLog(null);
          }}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <Spin spinning={detailLoading}>
          {selectedLog && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="操作时间">
                {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color={getActionColor(selectedLog.action)}>
                  {formatActionText(selectedLog.action)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源类型">
                {selectedLog.resourceType}
              </Descriptions.Item>
              <Descriptions.Item label="资源ID">
                {selectedLog.resourceId || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="资源名称">
                {formatResourceName(selectedLog)}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">
                {selectedLog.user?.name || selectedLog.user?.email || '系统'}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedLog.ipAddress || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                {selectedLog.userAgent || '无'}
              </Descriptions.Item>
              {selectedLog.details && (
                <Descriptions.Item label="详细信息">
                  <pre style={{ 
                    margin: 0, 
                    padding: 8, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Spin>
      </Modal>
    </AdminLayout>
  );
}

