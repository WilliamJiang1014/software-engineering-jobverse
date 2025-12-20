import { Card, Row, Col, Statistic, Typography, Table, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { message } from 'antd';

const { Title } = Typography;

interface DailyStat {
  date: string;
  jobs: number;
  applications: number;
  users: number;
}

interface TopCompany {
  rank: number;
  name: string;
  jobs: number;
  applications: number;
}

interface TopJob {
  rank: number;
  title: string;
  company: string;
  applications: number;
}

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
  dailyStats?: DailyStat[];
  topCompanies?: TopCompany[];
  topJobs?: TopJob[];
}

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
              dataSource={stats?.dailyStats || []}
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
              dataSource={stats?.topCompanies || []}
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
                dataSource={stats?.topJobs || []}
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
