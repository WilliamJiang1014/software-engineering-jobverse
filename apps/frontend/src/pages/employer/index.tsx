import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Tag, Button, Spin, message } from 'antd';
import { FileTextOutlined, TeamOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { employerApi } from '@/lib/api';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'processing', text: '待处理' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'processing', text: '面试中' },
  ACCEPTED: { color: 'success', text: '已录用' },
  REJECTED: { color: 'error', text: '不合适' },
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    stats: { activeJobs: 0, totalApplications: 0, pendingApplications: 0, acceptedApplications: 0 },
    recentCandidates: [],
    jobStats: []
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res: any = await employerApi.getDashboardStats();
        if (res.code === 200) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Fetch dashboard error:', error);
        // message.error('获取仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <EmployerLayout>
      <Head>
        <title>企业工作台 - JobVerse</title>
      </Head>
      
      <Title level={4}>欢迎回来，{user?.name || '企业用户'}！</Title>
      <Text type="secondary">这是您的招聘概览</Text>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="发布岗位" 
                value={data.stats.activeJobs} 
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="收到简历" 
                value={data.stats.totalApplications} 
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待处理" 
                value={data.stats.pendingApplications} 
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已录用" 
                value={data.stats.acceptedApplications} 
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
                dataSource={data.recentCandidates}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Link href="/employer/candidates" key="view">
                        <Button type="link">查看简历</Button>
                      </Link>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.name}
                      description={`应聘：${item.jobTitle} · ${new Date(item.date).toLocaleDateString()}`}
                    />
                    <Tag color={statusMap[item.status]?.color}>
                      {statusMap[item.status]?.text || item.status}
                    </Tag>
                  </List.Item>
                )}
                locale={{ emptyText: '暂无候选人' }}
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
                dataSource={data.jobStats}
                renderItem={(item: any) => (
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
                locale={{ emptyText: '暂无岗位数据' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </EmployerLayout>
  );
}
