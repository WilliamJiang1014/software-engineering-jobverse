import { Card, Row, Col, Statistic, Typography, Spin, Table, Button, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, BarChartOutlined, TableOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { message } from 'antd';
import { Line, Column, Pie } from '@ant-design/charts';

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
  const [activeTab, setActiveTab] = useState('data');

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

  // 准备折线图数据
  const lineData = weeklyStats.flatMap(item => [
    { date: item.date, type: '新增岗位', value: item.jobs },
    { date: item.date, type: '投递数', value: item.applications },
    { date: item.date, type: '新增用户', value: item.users },
  ]);

  // 准备岗位状态饼图数据
  const jobStatusData = stats ? [
    { type: '已通过', value: stats.approvedJobs },
    { type: '待审核', value: stats.pendingJobs },
    { type: '已驳回', value: stats.rejectedJobs },
  ].filter(item => item.value > 0) : [];

  // 准备热门企业柱状图数据
  const companyData = topCompanies.map(item => ({
    name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
    applications: item.applications,
  }));

  // 准备热门岗位柱状图数据
  const jobData = topJobs.map(item => ({
    title: item.title.length > 12 ? item.title.substring(0, 12) + '...' : item.title,
    applications: item.applications,
  }));

  // 折线图配置
  const lineConfig = {
    data: lineData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    point: {
      size: 4,
      shape: 'circle',
    },
    legend: {
      position: 'top' as const,
    },
    color: ['#1890ff', '#52c41a', '#faad14'],
    height: 300,
  };

  // 饼图配置
  const pieConfig = {
    data: jobStatusData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: {
      position: 'bottom' as const,
    },
    interactions: [{ type: 'element-active' }],
    color: ['#52c41a', '#faad14', '#ff4d4f'],
    height: 300,
    tooltip: {
      formatter: (datum: any) => {
        const total = jobStatusData.reduce((sum, item) => sum + item.value, 0);
        return { name: datum.type, value: `${datum.value} (${total > 0 ? ((datum.value / total) * 100).toFixed(1) : 0}%)` };
      },
    },
  };

  // 热门企业柱状图配置
  const companyColumnConfig = {
    data: companyData,
    xField: 'name',
    yField: 'applications',
    color: '#1890ff',
    label: {
      position: 'top' as const,
      style: {
        fill: '#666',
      },
    },
    height: 300,
    meta: {
      name: { alias: '企业名称' },
      applications: { alias: '投递数' },
    },
  };

  // 热门岗位柱状图配置
  const jobColumnConfig = {
    data: jobData,
    xField: 'title',
    yField: 'applications',
    color: '#52c41a',
    label: {
      position: 'top' as const,
      style: {
        fill: '#666',
      },
    },
    height: 300,
    meta: {
      title: { alias: '岗位名称' },
      applications: { alias: '投递数' },
    },
  };

  // 每日数据表格列
  const weeklyStatsColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
    { title: '新增岗位', dataIndex: 'jobs', key: 'jobs', align: 'right' as const },
    { title: '投递数', dataIndex: 'applications', key: 'applications', align: 'right' as const },
    { title: '新增用户', dataIndex: 'users', key: 'users', align: 'right' as const },
  ];

  // 热门企业表格列
  const companyColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 80, align: 'center' as const },
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '岗位数', dataIndex: 'jobs', key: 'jobs', align: 'right' as const },
    { title: '投递数', dataIndex: 'applications', key: 'applications', align: 'right' as const },
  ];

  // 热门岗位表格列
  const jobColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 80, align: 'center' as const },
    { title: '岗位名称', dataIndex: 'title', key: 'title' },
    { title: '企业', dataIndex: 'company', key: 'company' },
    { title: '投递数', dataIndex: 'applications', key: 'applications', align: 'right' as const },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>数据统计 - JobVerse</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>数据统计</Title>
        <Space>
          <Button
            type={activeTab === 'data' ? 'primary' : 'default'}
            icon={<TableOutlined />}
            onClick={() => setActiveTab('data')}
          >
            数据视图
          </Button>
          <Button
            type={activeTab === 'charts' ? 'primary' : 'default'}
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab('charts')}
          >
            图表视图
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* 概览统计 - 始终显示 */}
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

        {/* 总体统计 - 始终显示 */}
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

        {/* 岗位状态分布 - 始终显示 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="岗位状态分布">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>
                      {stats?.approvedJobs || 0}
                    </div>
                    <div style={{ color: '#666', marginTop: 8 }}>已通过</div>
                    {stats && stats.totalJobs > 0 && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {((stats.approvedJobs / stats.totalJobs) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>
                      {stats?.pendingJobs || 0}
                    </div>
                    <div style={{ color: '#666', marginTop: 8 }}>待审核</div>
                    {stats && stats.totalJobs > 0 && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {((stats.pendingJobs / stats.totalJobs) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f' }}>
                      {stats?.rejectedJobs || 0}
                    </div>
                    <div style={{ color: '#666', marginTop: 8 }}>已驳回</div>
                    {stats && stats.totalJobs > 0 && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {((stats.rejectedJobs / stats.totalJobs) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 数据视图和图表视图切换 */}
        {activeTab === 'data' ? (
          // 数据视图 - 表格展示
          <>
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={24}>
                <Card title="每日数据趋势（近7天）">
                  <Table
                    columns={weeklyStatsColumns}
                    dataSource={weeklyStats}
                    rowKey="date"
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Card title="热门企业 TOP5（按投递数）">
                  <Table
                    columns={companyColumns}
                    dataSource={topCompanies}
                    rowKey="rank"
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </Col>

              <Col span={12}>
                <Card title="热门岗位 TOP5（按投递数）">
                  <Table
                    columns={jobColumns}
                    dataSource={topJobs}
                    rowKey="rank"
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          // 图表视图
          <>
            <Row gutter={16} style={{ marginTop: 24 }}>
              {/* 每日数据趋势 - 折线图 */}
              <Col span={16}>
                <Card title="每日数据趋势（近7天）">
                  <Line {...lineConfig} />
                </Card>
              </Col>

              {/* 岗位状态分布 - 饼图 */}
              <Col span={8}>
                <Card title="岗位状态分布">
                  {jobStatusData.length > 0 ? (
                    <Pie {...pieConfig} />
                  ) : (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      暂无数据
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 24 }}>
              {/* 热门企业 - 柱状图 */}
              <Col span={12}>
                <Card title="热门企业 TOP5（按投递数）">
                  <Column {...companyColumnConfig} />
                </Card>
              </Col>

              {/* 热门岗位 - 柱状图 */}
              <Col span={12}>
                <Card title="热门岗位 TOP5（按投递数）">
                  <Column {...jobColumnConfig} />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </AdminLayout>
  );
}
