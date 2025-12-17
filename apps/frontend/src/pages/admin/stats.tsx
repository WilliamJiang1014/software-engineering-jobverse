import { Card, Row, Col, Statistic, Typography, Table } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';

const { Title } = Typography;

// 模拟统计数据
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
  return (
    <AdminLayout>
      <Head>
        <title>数据统计 - JobVerse</title>
      </Head>

      <Title level={4}>数据统计</Title>

      {/* 概览统计 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="本周新增岗位" 
              value={38} 
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
              value={222} 
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
              value={88} 
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
              value={2.5} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="小时"
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
    </AdminLayout>
  );
}

