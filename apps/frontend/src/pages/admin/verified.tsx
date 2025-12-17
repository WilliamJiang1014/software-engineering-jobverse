import { Table, Tag, Card, Button, Space, Typography, Modal, message } from 'antd';
import { SafetyCertificateOutlined, StopOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Company {
  id: string;
  name: string;
  industry: string;
  verified: boolean;
  verifiedAt?: string;
  contactPerson: string;
}

// 模拟数据
const mockCompanies: Company[] = [
  { id: '1', name: 'XX科技有限公司', industry: '互联网/IT', verified: true, verifiedAt: '2025-12-01', contactPerson: '李经理' },
  { id: '2', name: 'YY互联网公司', industry: '互联网/IT', verified: true, verifiedAt: '2025-11-20', contactPerson: '王总' },
  { id: '3', name: 'ZZ创新科技', industry: '人工智能', verified: false, contactPerson: '张总' },
  { id: '4', name: 'AA金融科技', industry: '金融', verified: false, contactPerson: '刘经理' },
];

export default function AdminVerified() {
  const handleVerify = (company: Company) => {
    Modal.confirm({
      title: '认证企业',
      content: `确定要认证「${company.name}」吗？认证后该企业发布的岗位将展示认证标识。`,
      onOk: () => {
        message.success('认证成功');
      },
    });
  };

  const handleRevoke = (company: Company) => {
    Modal.confirm({
      title: '取消认证',
      content: `确定要取消「${company.name}」的认证吗？`,
      okType: 'danger',
      onOk: () => {
        message.success('已取消认证');
      },
    });
  };

  const columns: ColumnsType<Company> = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson' },
    { 
      title: '认证状态', 
      dataIndex: 'verified', 
      key: 'verified',
      render: (verified: boolean) => (
        verified ? (
          <Tag color="success" icon={<SafetyCertificateOutlined />}>已认证</Tag>
        ) : (
          <Tag color="default">未认证</Tag>
        )
      )
    },
    { 
      title: '认证时间', 
      dataIndex: 'verifiedAt', 
      key: 'verifiedAt',
      render: (v) => v || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link">查看详情</Button>
          {record.verified ? (
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

  return (
    <AdminLayout>
      <Head>
        <title>认证管理 - JobVerse</title>
      </Head>

      <Title level={4}>认证管理</Title>
      <div style={{ marginBottom: 16 }}>
        <Tag color="success">已认证: {mockCompanies.filter(c => c.verified).length}</Tag>
        <Tag color="default" style={{ marginLeft: 8 }}>
          待认证: {mockCompanies.filter(c => !c.verified).length}
        </Tag>
      </div>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={mockCompanies} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </AdminLayout>
  );
}

