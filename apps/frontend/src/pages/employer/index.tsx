import { Card, Row, Col, Statistic, Typography, List, Tag, Button } from 'antd';
import { FileTextOutlined, TeamOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

const { Title, Text } = Typography;

// 模拟数据
const recentCandidates = [
  { id: '1', name: '张三', jobTitle: '前端开发工程师', status: 'PENDING', date: '2025-12-15' },
  { id: '2', name: '李四', jobTitle: '后端开发工程师', status: 'VIEWED', date: '2025-12-14' },
  { id: '3', name: '王五', jobTitle: '产品经理', status: 'ACCEPTED', date: '2025-12-13' },
];

const jobStats = [
  { id: '1', title: '前端开发工程师', applications: 15, views: 120 },
  { id: '2', title: '后端开发工程师', applications: 8, views: 85 },
  { id: '3', title: '产品经理', applications: 12, views: 95 },
];

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待处理' },
  VIEWED: { color: 'warning', text: '已查看' },
  ACCEPTED: { color: 'success', text: '已通过' },
  REJECTED: { color: 'error', text: '已拒绝' },
};

export default function EmployerDashboard() {
  const { user } = useAuth();

  return (
    <EmployerLayout>
      <Head>
        <title>企业工作台 - JobVerse</title>
      </Head>
      
      <Title level={4}>欢迎回来，{user?.name || '企业用户'}！</Title>
      <Text type="secondary">这是您的招聘概览</Text>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="发布岗位" 
              value={5} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="收到简历" 
              value={35} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待处理" 
              value={12} 
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已录用" 
              value={3} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 最新候选人 */}
        <Col span={12}>
          <Card 
            title="最新候选人" 
            extra={<Link href="/employer/candidates">查看全部</Link>}
          >
            <List
              dataSource={recentCandidates}
              renderItem={(item) => (
                <List.Item
                  actions={[<Button type="link" key="view">查看简历</Button>]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={`应聘：${item.jobTitle} · ${item.date}`}
                  />
                  <Tag color={statusMap[item.status]?.color}>
                    {statusMap[item.status]?.text}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 岗位数据 */}
        <Col span={12}>
          <Card 
            title="岗位数据" 
            extra={<Link href="/employer/jobs">管理岗位</Link>}
          >
            <List
              dataSource={jobStats}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                  />
                  <div>
                    <Text type="secondary" style={{ marginRight: 16 }}>
                      浏览 {item.views}
                    </Text>
                    <Text type="success">
                      投递 {item.applications}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </EmployerLayout>
  );
}

