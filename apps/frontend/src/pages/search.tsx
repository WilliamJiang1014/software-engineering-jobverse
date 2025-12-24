import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout, Typography, Button, Card, Row, Col, Tag, Space, Empty, Spin, message, Avatar, Dropdown, Select } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, UserOutlined, LogoutOutlined, DashboardOutlined } from '@ant-design/icons';
import { searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/Home.module.css';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

type JobCard = {
  id: string;
  title: string;
  company?: {
    id: string;
    name: string;
    verifiedBySchool?: boolean;
  };
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  tags?: string[];
};

export default function SearchPage() {
  const router = useRouter();
  const { keyword } = router.query;
  const { user, isAuthenticated, logout } = useAuth();

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'time' | 'salary'>('default');

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    if (min) return `${Math.round(min / 1000)}K+`;
    return `${Math.round((max || 0) / 1000)}K以内`;
  };

  const fetchJobs = async (nextPage: number, append = false) => {
    if (!keyword) return;
    
    setLoading(true);
    try {
      const res = await searchApi.jobs({ 
        keyword: keyword as string, 
        page: nextPage, 
        limit: 6,
        sortBy,
      });
      const items: JobCard[] = res.data?.items ?? [];
      const pagination = res.data?.pagination;

      setJobs((prev) => (append ? [...prev, ...items] : items));
      setHasMore(pagination ? nextPage < pagination.totalPages : false);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      message.error('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchJobs(page + 1, true);
  };

  const handleCardClick = (id: string) => {
    router.push(`/jobs/${id}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: user?.role === 'STUDENT' ? '学生工作台' :
             user?.role === 'EMPLOYER' ? '企业工作台' : '管理后台',
      onClick: () => {
        if (user?.role === 'STUDENT') router.push('/student');
        else if (user?.role === 'EMPLOYER') router.push('/employer');
        else router.push('/admin');
      }
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        router.push('/');
      }
    }
  ];

  useEffect(() => {
    if (keyword) {
      fetchJobs(1);
    }
  }, [keyword, sortBy]);

  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Head>
        <title>搜索结果：{keyword} - JobVerse</title>
        <meta name="description" content={`搜索结果：${keyword}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.logo}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>JobVerse</Title>
          </div>
          <Space>
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer', color: '#fff' }}>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span>{user?.name || '用户'}</span>
                </Space>
              </Dropdown>
            ) : (
              <>
                <Button type="link" style={{ color: '#fff' }} href="/login">登录</Button>
                <Button type="primary" ghost href="/register">注册</Button>
              </>
            )}
          </Space>
        </Header>

        <Content className={styles.content}>
          <div className={styles.jobSection}>
            <div className={styles.sectionHeader}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>返回首页</Button>
                <Title level={3}>搜索结果：{keyword}</Title>
              </Space>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 180 }}
                options={[
                  { label: '综合排序', value: 'default' },
                  { label: '最新发布', value: 'time' },
                  { label: '薪资优先', value: 'salary' },
                ]}
              />
            </div>

            {loading && jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : jobs.length === 0 ? (
              <Empty description="未找到相关岗位" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {jobs.map((job) => (
                    <Col xs={24} sm={12} lg={8} key={job.id}>
                      <Card hoverable className={styles.jobCard} onClick={() => handleCardClick(job.id)}>
                        <div className={styles.jobHeader}>
                          <Title level={5} className={styles.jobTitle}>
                            {renderHighlightedText(job.title, String(keyword))}
                          </Title>
                          <Text type="success" strong>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
                        </div>
                        <div className={styles.jobCompany}>
                          <Text>{job.company?.name ?? '未命名企业'}</Text>
                          {job.company?.verifiedBySchool && (
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
                          {(job.tags ?? []).slice(0, 4).map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <div className={styles.moreJobs}>
                  <Button type="primary" size="large" onClick={handleLoadMore} disabled={!hasMore} loading={loading}>
                    {hasMore ? '查看更多岗位' : '没有更多了'}
                  </Button>
                </div>
              </>
            )}
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
