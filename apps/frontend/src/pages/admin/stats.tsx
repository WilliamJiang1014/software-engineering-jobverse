import { Card, Row, Col, Statistic, Typography, Table, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { message } from 'antd';

const { Title } = Typography;

interface Stats {
  totalJobs: number;
  pendingJobs: number;
  approvedJobs: number;
  rejectedJobs: number;
  totalUsers: number;
  totalApplications: number;
  todayApplications: number;
  weeklyJobs: number;
  weeklyApplications: number;
  weeklyUsers: number;
  avgReviewTime: number;
}

// 模拟统计数据（如果后端没有提供）
const weeklyStats = [
  { date: '12-09', jobs: 5, applications: 23, users: 12 },
  { date: '12-10', jobs: 8, applications: 35, users: 18 },
  { date: '12-11', jobs: 3, applications: 28, users: 8 },
  { date: '12-12', jobs: 6, applications: 42, users: 15 },
  { date: '12-13', jobs: 4, applications: 31, users: 10 },
  { date: '12-14', jobs: 7, applications: 38, users: 14 },
  { date: '12-15', jobs: 5, applications: 25, users: 11 },
];

const topCompanies = [
  { rank: 1, name: 'XX科技有限公司', jobs: 12, applications: 156 },
  { rank: 2, name: 'YY互联网公司', jobs: 8, applications: 98 },
  { rank: 3, name: 'ZZ创新科技', jobs: 6, applications: 75 },
  { rank: 4, name: 'AA金融科技', jobs: 5, applications: 62 },
  { rank: 5, name: 'BB人工智能', jobs: 4, applications: 48 },
];

const topJobs = [
  { rank: 1, title: '前端开发工程师', company: 'XX科技', applications: 45 },
  { rank: 2, title: 'Java开发工程师', company: 'AA科技', applications: 38 },
  { rank: 3, title: '产品经理', company: 'YY互联网', applications: 32 },
  { rank: 4, title: '后端开发工程师', company: 'XX科技', applications: 28 },
  { rank: 5, title: 'AI算法工程师', company: 'BB人工智能', applications: 25 },
];

export default function AdminStats() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminApi.audit.getStats();
      if (response.code === 200) {
        setStats(response.data);
      } else {
        message.error(response.message || '获取统计数据失败');
      }
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      message.error(error.message || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>数据统计 - JobVerse</title>
      </Head>

      <Title level={4}>数据统计</Title>

      <Spin spinning={loading}>
        {/* 概览统计 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="本周新增岗位" 
                value={stats?.weeklyJobs || 0} 
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="本周投递数" 
                value={stats?.weeklyApplications || 0} 
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="本周新增用户" 
                value={stats?.weeklyUsers || 0} 
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="平均审核时长" 
                value={stats?.avgReviewTime || 0} 
                valueStyle={{ color: stats?.avgReviewTime && stats.avgReviewTime > 0 ? '#3f8600' : '#cf1322' }}
                prefix={stats?.avgReviewTime && stats.avgReviewTime > 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                suffix="小时"
                precision={1}
              />
            </Card>
          </Col>
        </Row>

        {/* 总体统计 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总岗位数" 
                value={stats?.totalJobs || 0} 
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待审核岗位" 
                value={stats?.pendingJobs || 0} 
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已通过岗位" 
                value={stats?.approvedJobs || 0} 
                valueStyle={{ color: '#52c41a' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已驳回岗位" 
                value={stats?.rejectedJobs || 0} 
                valueStyle={{ color: '#ff4d4f' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic 
                title="总用户数" 
                value={stats?.totalUsers || 0} 
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="总投递数" 
                value={stats?.totalApplications || 0} 
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="今日投递数" 
                value={stats?.todayApplications || 0} 
                valueStyle={{ color: '#1890ff' }}
                suffix="次"
              />
            </Card>
          </Col>
        </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 每日统计 */}
        <Col span={24}>
          <Card title="每日数据趋势">
            <Table
              columns={[
                { title: '日期', dataIndex: 'date', key: 'date' },
                { title: '新增岗位', dataIndex: 'jobs', key: 'jobs' },
                { title: '投递数', dataIndex: 'applications', key: 'applications' },
                { title: '新增用户', dataIndex: 'users', key: 'users' },
              ]}
              dataSource={weeklyStats}
              rowKey="date"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 热门企业 */}
        <Col span={12}>
          <Card title="热门企业 TOP5">
            <Table
              columns={[
                { title: '排名', dataIndex: 'rank', key: 'rank', width: 60 },
                { title: '企业名称', dataIndex: 'name', key: 'name' },
                { title: '岗位数', dataIndex: 'jobs', key: 'jobs' },
                { title: '投递数', dataIndex: 'applications', key: 'applications' },
              ]}
              dataSource={topCompanies}
              rowKey="rank"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

          {/* 热门岗位 */}
          <Col span={12}>
            <Card title="热门岗位 TOP5">
              <Table
                columns={[
                  { title: '排名', dataIndex: 'rank', key: 'rank', width: 60 },
                  { title: '岗位名称', dataIndex: 'title', key: 'title' },
                  { title: '企业', dataIndex: 'company', key: 'company' },
                  { title: '投递数', dataIndex: 'applications', key: 'applications' },
                ]}
                dataSource={topJobs}
                rowKey="rank"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </AdminLayout>
  );
}
