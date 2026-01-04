import { Card, Row, Col, Statistic, Typography, List, Tag, Button, Spin, message } from 'antd';
import { FileTextOutlined, HeartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { applicationApi, bookmarkApi } from '@/lib/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  bookmarksCount: number;
}

interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  date: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'processing', text: '待查看' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'blue', text: '面试中' },
  REJECTED: { color: 'error', text: '未通过' },
  ACCEPTED: { color: 'success', text: '已通过' },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    bookmarksCount: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 并行获取统计数据和最近投递记录
      const [statsResponse, applicationsResponse] = await Promise.all([
        applicationApi.stats(),
        applicationApi.list({ page: 1, limit: 5 }),
      ]);

      if (statsResponse.code === 200) {
        setStats(statsResponse.data);
      } else {
        console.error('获取统计数据失败:', statsResponse.message);
      }

      if (applicationsResponse.code === 200) {
        const apps = applicationsResponse.data.items.map((app: any) => ({
          id: app.id,
          jobTitle: app.job.title,
          company: app.job.company.name,
          status: app.status,
          date: new Date(app.appliedAt).toLocaleDateString('zh-CN'),
        }));
        setRecentApplications(apps);
      } else {
        console.error('获取最近投递失败:', applicationsResponse.message);
      }
    } catch (error: any) {
      console.error('获取工作台数据失败:', error);
      message.error('获取工作台数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <Head>
        <title>学生工作台 - JobVerse</title>
      </Head>
      
      <Title level={4}>欢迎回来，{user?.name || '同学'}！</Title>
      <Text type="secondary">这是你的求职概览</Text>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已投递" 
                value={stats.totalApplications} 
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待查看" 
                value={stats.pendingApplications} 
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已通过" 
                value={stats.acceptedApplications} 
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="收藏岗位" 
                value={stats.bookmarksCount} 
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
              {recentApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无投递记录
                </div>
              ) : (
                <List
                  dataSource={recentApplications}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.jobTitle}
                        description={`${item.company} · ${item.date}`}
                      />
                      <Tag color={statusMap[item.status]?.color}>
                        {statusMap[item.status]?.text || item.status}
                      </Tag>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 推荐岗位 - 暂时保留，后续可以对接推荐算法 */}
          <Col span={12}>
            <Card 
              title="推荐岗位" 
              extra={<Link href="/">搜索岗位</Link>}
            >
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                推荐功能开发中，请前往搜索岗位
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </StudentLayout>
  );
}

