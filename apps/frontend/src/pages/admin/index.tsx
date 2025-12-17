import { Card, Row, Col, Statistic, Typography, List, Tag, Button } from 'antd';
import { AuditOutlined, SafetyOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

const { Title, Text } = Typography;

// 模拟数据
const pendingReviews = [
  { id: '1', jobTitle: 'UI设计师', company: 'XX科技', submittedAt: '2025-12-15 10:30' },
  { id: '2', jobTitle: '数据分析师', company: 'YY互联网', submittedAt: '2025-12-15 09:20' },
  { id: '3', jobTitle: '运营专员', company: 'ZZ创新', submittedAt: '2025-12-14 16:45' },
];

const recentActions = [
  { id: '1', action: '审核通过', jobTitle: '前端开发工程师', operator: '张老师', time: '2025-12-15 11:00' },
  { id: '2', action: '审核驳回', jobTitle: '测试工程师', operator: '张老师', time: '2025-12-14 15:30' },
  { id: '3', action: '认证企业', company: 'AA科技', operator: '张老师', time: '2025-12-13 10:20' },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <Head>
        <title>管理工作台 - JobVerse</title>
      </Head>
      
      <Title level={4}>欢迎回来，{user?.name || '管理员'}！</Title>
      <Text type="secondary">这是您的管理概览</Text>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待审核岗位" 
              value={3} 
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已认证企业" 
              value={15} 
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="在线岗位" 
              value={86} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="注册学生" 
              value={1250} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 待审核 */}
        <Col span={12}>
          <Card 
            title="待审核岗位" 
            extra={<Link href="/admin/review">查看全部</Link>}
          >
            <List
              dataSource={pendingReviews}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" key="review">审核</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.jobTitle}
                    description={`${item.company} · 提交于 ${item.submittedAt}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 最近操作 */}
        <Col span={12}>
          <Card title="最近操作">
            <List
              dataSource={recentActions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        <Tag color={item.action.includes('通过') ? 'success' : item.action.includes('驳回') ? 'error' : 'blue'}>
                          {item.action}
                        </Tag>
                        {item.jobTitle || item.company}
                      </span>
                    }
                    description={`${item.operator} · ${item.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}

