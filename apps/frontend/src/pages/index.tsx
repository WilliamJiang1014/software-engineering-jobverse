import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout, Typography, Input, Button, Card, Row, Col, Tag, Space, Empty, Spin, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { jobApi, searchApi } from '@/lib/api';
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

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [hotKeywords, setHotKeywords] = useState<HotKeyword[]>([]);

  const sectionTitle = useMemo(() => {
    if (keyword) return `搜索结果：${keyword}`;
    return '热门岗位';
  }, [keyword]);

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

  const fetchJobs = async (opts?: { append?: boolean; keyword?: string; nextPage?: number }) => {
    setLoading(true);
    try {
      const currentPage = opts?.nextPage ?? 1;
      const params = { page: currentPage, limit: 6 } as Record<string, unknown>;
      if (opts?.keyword) params.keyword = opts.keyword;

      const apiCall = opts?.keyword ? searchApi.jobs : jobApi.list;
      const res = await apiCall(params);
      const items: JobCard[] = res.data?.items ?? [];
      const pagination = res.data?.pagination;

      setJobs((prev) => (opts?.append ? [...prev, ...items] : items));
      setHasMore(pagination ? currentPage < pagination.totalPages : false);
      setPage(currentPage);
    } catch (err) {
      console.error(err);
      message.error('加载岗位失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value.trim());
    fetchJobs({ keyword: value.trim(), nextPage: 1 });
  };

  const handleHotClick = (kw: string) => {
    setKeyword(kw);
    fetchJobs({ keyword: kw, nextPage: 1 });
  };

  const handleLoadMore = () => {
    fetchJobs({ keyword, nextPage: page + 1, append: true });
  };

  const handleCardClick = (id: string) => {
    router.push(`/jobs/${id}`);
  };

  useEffect(() => {
    fetchHotKeywords();
    fetchJobs({ nextPage: 1 });
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
            <Button type="link" style={{ color: '#fff' }} href="/login">登录</Button>
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
              <Title level={3}>{sectionTitle}</Title>
              {keyword && (
                <Button type="link" onClick={() => handleSearch('')}>清除搜索</Button>
              )}
            </div>

            {loading && jobs.length === 0 ? (
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

