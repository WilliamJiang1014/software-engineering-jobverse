import { Card, Row, Col, Statistic, Typography, List, Tag, Button, Spin, Empty } from 'antd';
import { FileTextOutlined, HeartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { applicationApi, jobApi } from '@/lib/api';
import { message } from 'antd';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'processing', text: '待查看' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'blue', text: '面试中' },
  REJECTED: { color: 'error', text: '未通过' },
  ACCEPTED: { color: 'success', text: '已通过' },
};

interface StudentStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  totalBookmarks: number;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    company: string;
    status: string;
    date: string;
  }>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResponse, jobsResponse] = await Promise.all([
        applicationApi.getStats(),
        jobApi.list({ page: 1, limit: 3 }),
      ]);

      if (statsResponse.code === 200) {
        setStats(statsResponse.data);
      }

      if (jobsResponse.code === 200 && jobsResponse.data?.items) {
        const jobs = jobsResponse.data.items.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company?.name || '未知企业',
          salary: job.salaryMin && job.salaryMax 
            ? `${Math.round(job.salaryMin / 1000)}K-${Math.round(job.salaryMax / 1000)}K`
            : '薪资面议',
          location: job.location,
        }));
        setRecommendedJobs(jobs);
      }
    } catch (error: any) {
      console.error('获取数据失败:', error);
      message.error(error.message || '获取数据失败');
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
                value={stats?.totalApplications || 0} 
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待查看" 
                value={stats?.pendingApplications || 0} 
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已通过" 
                value={stats?.acceptedApplications || 0} 
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="收藏岗位" 
                value={stats?.totalBookmarks || 0} 
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
              {stats?.recentApplications && stats.recentApplications.length > 0 ? (
                <List
                  dataSource={stats.recentApplications}
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
              ) : (
                <Empty description="暂无投递记录" />
              )}
            </Card>
          </Col>

          {/* 推荐岗位 */}
          <Col span={12}>
            <Card 
              title="推荐岗位" 
              extra={<Link href="/student/jobs">搜索岗位</Link>}
            >
              {recommendedJobs.length > 0 ? (
                <List
                  dataSource={recommendedJobs}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="link" 
                          key="view"
                          onClick={() => window.location.href = `/jobs/${item.id}`}
                        >
                          查看
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={`${item.company} · ${item.location} · ${item.salary}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无推荐岗位" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </StudentLayout>
  );
}

