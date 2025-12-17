import { Card, List, Tag, Space, Button, Empty } from 'antd';
import { EnvironmentOutlined, DeleteOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import Head from 'next/head';
import { Typography } from 'antd';

const { Title } = Typography;

// 模拟收藏数据
const mockBookmarks = [
  { id: '1', title: '前端开发工程师', company: 'XX科技有限公司', location: '北京', salary: '15K-25K', tags: ['React', 'TypeScript'], verified: true },
  { id: '2', title: 'Java开发工程师', company: 'AA科技', location: '杭州', salary: '20K-35K', tags: ['Java', 'Spring Boot'], verified: true },
  { id: '3', title: 'AI算法工程师', company: 'BB人工智能', location: '北京', salary: '30K-50K', tags: ['Python', 'PyTorch'], verified: true },
  { id: '4', title: '产品经理', company: 'ZZ创新科技', location: '深圳', salary: '20K-35K', tags: ['B端', '数据分析'], verified: false },
];

export default function StudentBookmarks() {
  return (
    <StudentLayout>
      <Head>
        <title>我的收藏 - JobVerse</title>
      </Head>

      <Title level={4}>我的收藏</Title>

      {mockBookmarks.length === 0 ? (
        <Empty description="暂无收藏的岗位" />
      ) : (
        <List
          style={{ marginTop: 16 }}
          dataSource={mockBookmarks}
          renderItem={(job) => (
            <Card hoverable style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space direction="vertical" size={4}>
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{job.title}</span>
                    {job.verified && <Tag color="blue">学校认证</Tag>}
                  </Space>
                  <Space>
                    <span>{job.company}</span>
                    <span><EnvironmentOutlined /> {job.location}</span>
                    <span style={{ color: '#52c41a' }}>{job.salary}</span>
                  </Space>
                  <Space>
                    {job.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                  </Space>
                </Space>
                <Space>
                  <Button icon={<DeleteOutlined />} danger>取消收藏</Button>
                  <Button type="primary">投递</Button>
                </Space>
              </div>
            </Card>
          )}
        />
      )}
    </StudentLayout>
  );
}

