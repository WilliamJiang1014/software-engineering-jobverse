import { Table, Tag, Card, Button, Space, Typography, Modal, message, Spin } from 'antd';
import { SafetyCertificateOutlined, StopOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const { Title } = Typography;

interface Company {
  id: string;
  name: string;
  industry?: string;
  scale?: string;
  location?: string;
  verifiedBySchool: boolean;
  createdAt: string;
}

export default function AdminVerified() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // 角色检查：只有学校管理员可以访问
  useEffect(() => {
    if (user && user.role !== 'SCHOOL_ADMIN') {
      message.error('您没有权限访问此页面');
      router.push('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'SCHOOL_ADMIN') {
      fetchCompanies();
    }
  }, [pagination.page, pagination.limit, user]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await adminApi.review.getCompanies({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.code === 200) {
        setCompanies(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取企业列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取企业列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (company: Company) => {
    Modal.confirm({
      title: '认证企业',
      content: `确定要认证「${company.name}」吗？认证后该企业发布的岗位将展示认证标识。`,
      onOk: async () => {
        try {
          const response = await adminApi.review.verifyCompany(company.id, true);
          if (response.code === 200) {
            message.success('认证成功');
            fetchCompanies();
          } else {
            message.error(response.message || '认证失败');
          }
        } catch (error: any) {
          message.error(error.message || '认证失败');
        }
      },
    });
  };

  const handleRevoke = (company: Company) => {
    Modal.confirm({
      title: '取消认证',
      content: `确定要取消「${company.name}」的认证吗？`,
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await adminApi.review.verifyCompany(company.id, false);
          if (response.code === 200) {
            message.success('已取消认证');
            fetchCompanies();
          } else {
            message.error(response.message || '取消认证失败');
          }
        } catch (error: any) {
          message.error(error.message || '取消认证失败');
        }
      },
    });
  };

  const columns: ColumnsType<Company> = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry', render: (v) => v || '-' },
    { title: '规模', dataIndex: 'scale', key: 'scale', render: (v) => v || '-' },
    { title: '所在地', dataIndex: 'location', key: 'location', render: (v) => v || '-' },
    { 
      title: '认证状态', 
      dataIndex: 'verifiedBySchool', 
      key: 'verifiedBySchool',
      render: (verified: boolean) => (
        verified ? (
          <Tag color="success" icon={<SafetyCertificateOutlined />}>已认证</Tag>
        ) : (
          <Tag color="default">未认证</Tag>
        )
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.verifiedBySchool ? (
            <Button 
              type="link" 
              icon={<StopOutlined />} 
              danger
              onClick={() => handleRevoke(record)}
            >
              取消认证
            </Button>
          ) : (
            <Button 
              type="link" 
              icon={<SafetyCertificateOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleVerify(record)}
            >
              认证
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const verifiedCount = companies.filter(c => c.verifiedBySchool).length;
  const unverifiedCount = companies.filter(c => !c.verifiedBySchool).length;

  // 如果不是学校管理员，显示无权限提示
  if (user && user.role !== 'SCHOOL_ADMIN') {
    return (
      <AdminLayout>
        <Head>
          <title>认证管理 - JobVerse</title>
        </Head>
        <Card>
          <Typography.Title level={4}>无权限访问</Typography.Title>
          <Typography.Text type="secondary">您没有权限访问此页面，只有学校管理员可以管理企业认证。</Typography.Text>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>认证管理 - JobVerse</title>
      </Head>

      <Title level={4}>认证管理</Title>
      <div style={{ marginBottom: 16 }}>
        <Tag color="success">已认证: {verifiedCount}</Tag>
        <Tag color="default" style={{ marginLeft: 8 }}>
          未认证: {unverifiedCount}
        </Tag>
      </div>
      
      <Card>
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={companies} 
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
    </AdminLayout>
  );
}
