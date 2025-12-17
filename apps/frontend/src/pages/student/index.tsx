import { Card, Row, Col, Statistic, Typography, List, Tag, Button } from 'antd';
import { FileTextOutlined, HeartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

const { Title, Text } = Typography;

// 模拟数据
const recentApplications = [
  { id: '1', jobTitle: '前端开发工程师', company: 'XX科技', status: 'PENDING', date: '2025-12-15' },
  { id: '2', jobTitle: '后端开发工程师', company: 'YY互联网', status: 'VIEWED', date: '2025-12-14' },
  { id: '3', jobTitle: '产品经理', company: 'ZZ创新', status: 'REJECTED', date: '2025-12-13' },
];

const recommendedJobs = [
  { id: '1', title: '前端开发实习生', company: 'AA公司', salary: '150-200/天', location: '北京' },
  { id: '2', title: 'Java开发工程师', company: 'BB科技', salary: '15K-25K', location: '上海' },
  { id: '3', title: '数据分析师', company: 'CC数据', salary: '18K-28K', location: '深圳' },
];

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待查看' },
  VIEWED: { color: 'warning', text: '已查看' },
  REJECTED: { color: 'error', text: '未通过' },
  ACCEPTED: { color: 'success', text: '已通过' },
};

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <StudentLayout>
      <Head>
        <title>学生工作台 - JobVerse</title>
      </Head>
      
      <Title level={4}>欢迎回来，{user?.name || '同学'}！</Title>
      <Text type="secondary">这是你的求职概览</Text>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已投递" 
              value={6} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待查看" 
              value={3} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已通过" 
              value={1} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="收藏岗位" 
              value={4} 
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 最近投递 */}
        <Col span={12}>
          <Card 
            title="最近投递" 
            extra={<Link href="/student/applications">查看全部</Link>}
          >
            <List
              dataSource={recentApplications}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.jobTitle}
                    description={`${item.company} · ${item.date}`}
                  />
                  <Tag color={statusMap[item.status]?.color}>
                    {statusMap[item.status]?.text}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 推荐岗位 */}
        <Col span={12}>
          <Card 
            title="推荐岗位" 
            extra={<Link href="/">去首页搜索</Link>}
          >
            <List
              dataSource={recommendedJobs}
              renderItem={(item) => (
                <List.Item
                  actions={[<Button type="link" key="apply">投递</Button>]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.company} · ${item.location} · ${item.salary}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </StudentLayout>
  );
}

