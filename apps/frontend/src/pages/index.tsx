import Head from 'next/head';
import { Layout, Typography, Input, Button, Card, Row, Col, Tag, Space } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import styles from '@/styles/Home.module.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

// 模拟热门岗位数据
const mockJobs = [
  {
    id: '1',
    title: '前端开发工程师',
    company: 'XX科技有限公司',
    location: '北京',
    salary: '15K-25K',
    tags: ['React', 'TypeScript'],
    verified: true,
  },
  {
    id: '2',
    title: '后端开发工程师',
    company: 'YY互联网公司',
    location: '上海',
    salary: '18K-30K',
    tags: ['Node.js', 'PostgreSQL'],
    verified: true,
  },
  {
    id: '3',
    title: '产品经理',
    company: 'ZZ创新科技',
    location: '深圳',
    salary: '20K-35K',
    tags: ['B端', '数据分析'],
    verified: false,
  },
];

// 热门搜索标签
const hotTags = ['前端开发', 'Java', '产品经理', '数据分析', 'UI设计', '运营'];

export default function Home() {
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
    // TODO: 跳转到搜索结果页
  };

  return (
    <>
      <Head>
        <title>JobVerse - 面向高校学生的智能招聘平台</title>
        <meta name="description" content="JobVerse 是一个面向高校学生的智能一体化招聘平台" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.logo}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>JobVerse</Title>
          </div>
          <Space>
            <Button type="link" style={{ color: '#fff' }}>登录</Button>
            <Button type="primary" ghost>注册</Button>
          </Space>
        </Header>

        <Content className={styles.content}>
          {/* 搜索区域 */}
          <div className={styles.searchSection}>
            <Title level={2} className={styles.searchTitle}>
              找到你的理想工作
            </Title>
            <Search
              placeholder="搜索职位、公司..."
              allowClear
              enterButton={<><SearchOutlined /> 搜索</>}
              size="large"
              className={styles.searchInput}
              onSearch={handleSearch}
            />
            <div className={styles.hotTags}>
              <Text type="secondary">热门搜索：</Text>
              {hotTags.map((tag) => (
                <Tag key={tag} className={styles.hotTag}>{tag}</Tag>
              ))}
            </div>
          </div>

          {/* 热门岗位 */}
          <div className={styles.jobSection}>
            <Title level={3}>热门岗位</Title>
            <Row gutter={[16, 16]}>
              {mockJobs.map((job) => (
                <Col xs={24} sm={12} lg={8} key={job.id}>
                  <Card hoverable className={styles.jobCard}>
                    <div className={styles.jobHeader}>
                      <Title level={5} className={styles.jobTitle}>{job.title}</Title>
                      <Text type="success" strong>{job.salary}</Text>
                    </div>
                    <div className={styles.jobCompany}>
                      <Text>{job.company}</Text>
                      {job.verified && (
                        <Tag color="blue">学校认证</Tag>
                      )}
                    </div>
                    <div className={styles.jobMeta}>
                      <Space>
                        <Text type="secondary">
                          <EnvironmentOutlined /> {job.location}
                        </Text>
                      </Space>
                    </div>
                    <div className={styles.jobTags}>
                      {job.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div className={styles.moreJobs}>
              <Button type="primary" size="large">查看更多岗位</Button>
            </div>
          </div>
        </Content>

        <Footer className={styles.footer}>
          <Text type="secondary">
            JobVerse ©{new Date().getFullYear()} - 面向高校学生的智能一体化招聘平台
          </Text>
        </Footer>
      </Layout>
    </>
  );
}

