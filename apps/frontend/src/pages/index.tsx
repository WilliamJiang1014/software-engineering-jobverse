import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout, Typography, Input, Button, Card, Row, Col, Tag, Space, Empty, Spin, message, Avatar, Dropdown, AutoComplete } from 'antd';
import { SearchOutlined, EnvironmentOutlined, UserOutlined, LogoutOutlined, DashboardOutlined } from '@ant-design/icons';
import { jobApi, searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuProps } from 'antd';
import styles from '@/styles/Home.module.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

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

type HotKeyword = { keyword: string; count: number };

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hotKeywords, setHotKeywords] = useState<HotKeyword[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [suggestOptions, setSuggestOptions] = useState<{ value: string }[]>([]);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    if (min) return `${Math.round(min / 1000)}K+`;
    return `${Math.round((max || 0) / 1000)}K以内`;
  };

  const fetchHotKeywords = async () => {
    try {
      const res = await searchApi.hot();
      setHotKeywords(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobApi.list({ page: 1, limit: 3 });
      const items: JobCard[] = res.data?.items ?? [];
      setJobs(items);
    } catch (err) {
      console.error(err);
      message.error('加载岗位失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim();
    if (keyword) {
      router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  const handleSuggest = (value: string) => {
    setSearchValue(value);
    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }
    const keyword = value.trim();
    if (!keyword) {
      setSuggestOptions([]);
      return;
    }
    suggestTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchApi.suggest(keyword);
        const items = (res.data || []).map((item: string) => ({ value: item }));
        setSuggestOptions(items);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleHotClick = (kw: string) => {
    router.push(`/search?keyword=${encodeURIComponent(kw)}`);
  };

  const handleViewMore = () => {
    router.push('/jobs');
  };

  const handleCardClick = (id: string) => {
    router.push(`/jobs/${id}`);
  };

  useEffect(() => {
    fetchHotKeywords();
    fetchJobs();
  }, []);

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
            {isAuthenticated ? (
              <>
                <Dropdown
                  menu={{
                    items: [
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
                    ]
                  }}
                  placement="bottomRight"
                >
                  <Space style={{ cursor: 'pointer', color: '#fff' }}>
                    <Avatar icon={<UserOutlined />} size="small" />
                    <span>{user?.name || '用户'}</span>
                  </Space>
                </Dropdown>
              </>
            ) : (
              <>
                <Button type="link" style={{ color: '#fff' }} href="/login">登录</Button>
                <Button type="primary" ghost href="/register">注册</Button>
              </>
            )}
          </Space>
        </Header>

        <Content className={styles.content}>
          {/* 搜索区域 */}
          <div className={styles.searchSection}>
            <Title level={2} className={styles.searchTitle}>
              {isAuthenticated ? `欢迎回来，${user?.name || '同学'}！` : '找到你的理想工作'}
            </Title>
            {!isAuthenticated && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                登录后可以收藏岗位、投递简历，享受更多功能
              </Text>
            )}
            <AutoComplete
              className={styles.searchInput}
              options={suggestOptions}
              value={searchValue}
              onSearch={handleSuggest}
              onSelect={(value) => handleSearch(String(value))}
              onChange={(value) => setSearchValue(String(value))}
            >
              <Search
                placeholder="搜索职位、公司..."
                allowClear
                enterButton={<><SearchOutlined /> 搜索</>}
                size="large"
                onSearch={(value) => handleSearch(value)}
              />
            </AutoComplete>
            <div className={styles.hotTags}>
              <Text type="secondary">热门搜索：</Text>
              {hotKeywords.map((tag) => (
                <Tag key={tag.keyword} className={styles.hotTag} onClick={() => handleHotClick(tag.keyword)}>
                  {tag.keyword}
                </Tag>
              ))}
            </div>
          </div>

          {/* 岗位列表 */}
          <div className={styles.jobSection}>
            <div className={styles.sectionHeader}>
              <Title level={3}>热门岗位</Title>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : jobs.length === 0 ? (
              <Empty description="暂无岗位" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {jobs.map((job) => (
                    <Col xs={24} sm={12} lg={8} key={job.id}>
                      <Card hoverable className={styles.jobCard} onClick={() => handleCardClick(job.id)}>
                        <div className={styles.jobHeader}>
                          <Title level={5} className={styles.jobTitle}>{job.title}</Title>
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
                  <Button type="primary" size="large" onClick={handleViewMore}>
                    查看更多岗位
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
