import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Input, Card, Row, Col, Tag, Space, Empty, Spin, message, Button, Typography } from 'antd';
import { SearchOutlined, EnvironmentOutlined, StarOutlined, StarFilled, SendOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { jobApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/Home.module.css';

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
  isBookmarked?: boolean;
  isApplied?: boolean;
};

export default function StudentJobsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { keyword } = router.query;

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [bookmarking, setBookmarking] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState<Record<string, boolean>>({});

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    if (min) return `${Math.round(min / 1000)}K+`;
    return `${Math.round((max || 0) / 1000)}K以内`;
  };

  const fetchJobs = async (nextPage: number, append = false, searchKey?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: nextPage, limit: 12 };
      if (searchKey) {
        params.keyword = searchKey;
      }
      
      const res = await jobApi.list(params);
      const items: JobCard[] = res.data?.items ?? [];
      const pagination = res.data?.pagination;

      // 确保每个岗位都有 isBookmarked 和 isApplied 字段（即使为 false）
      const itemsWithBookmark = items.map(item => ({
        ...item,
        isBookmarked: item.isBookmarked ?? false,
        isApplied: item.isApplied ?? false,
      }));

      setJobs((prev) => (append ? [...prev, ...itemsWithBookmark] : itemsWithBookmark));
      setHasMore(pagination ? nextPage < pagination.totalPages : false);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      message.error('加载岗位失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim();
    setSearchKeyword(keyword);
    router.push({
      pathname: '/student/jobs',
      query: keyword ? { keyword } : {},
    }, undefined, { shallow: true });
    fetchJobs(1, false, keyword || undefined);
  };

  const handleLoadMore = () => {
    fetchJobs(page + 1, true, searchKeyword || undefined);
  };

  const handleCardClick = (id: string) => {
    router.push(`/jobs/${id}`);
  };

  const handleBookmark = async (e: React.MouseEvent, jobId: string, isBookmarked: boolean) => {
    e.stopPropagation(); // 阻止卡片点击事件
    
    if (!isAuthenticated) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    setBookmarking({ ...bookmarking, [jobId]: true });
    try {
      if (isBookmarked) {
        const response = await jobApi.unbookmark(jobId);
        if (response.code === 200) {
          message.success('取消收藏成功');
          setJobs(jobs.map(job => 
            job.id === jobId ? { ...job, isBookmarked: false } : job
          ));
        } else {
          message.error(response.message || '取消收藏失败');
        }
      } else {
        const response = await jobApi.bookmark(jobId);
        if (response.code === 200) {
          message.success('收藏成功');
          setJobs(jobs.map(job => 
            job.id === jobId ? { ...job, isBookmarked: true } : job
          ));
        } else {
          message.error(response.message || '收藏失败');
        }
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setBookmarking({ ...bookmarking, [jobId]: false });
    }
  };

  const handleApply = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // 阻止卡片点击事件
    
    if (!isAuthenticated) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    setApplying({ ...applying, [jobId]: true });
    try {
      const response = await jobApi.apply(jobId);
      if (response.code === 200 || response.code === 201) {
        message.success('投递成功');
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, isApplied: true } : job
        ));
      } else {
        message.error(response.message || '投递失败');
      }
    } catch (error: any) {
      message.error(error.message || error.response?.data?.message || '投递失败');
    } finally {
      setApplying({ ...applying, [jobId]: false });
    }
  };

  useEffect(() => {
    const searchKey = typeof keyword === 'string' ? keyword : '';
    setSearchKeyword(searchKey);
    fetchJobs(1, false, searchKey || undefined);
  }, [keyword]);

  return (
    <StudentLayout>
      <Head>
        <title>岗位搜索 - JobVerse</title>
      </Head>

      <Title level={4}>岗位搜索</Title>
      
      <div style={{ marginBottom: 24 }}>
        <Search
          placeholder="搜索职位、公司..."
          allowClear
          enterButton={<><SearchOutlined /> 搜索</>}
          size="large"
          defaultValue={typeof keyword === 'string' ? keyword : ''}
          onSearch={handleSearch}
          style={{ maxWidth: 600 }}
        />
      </div>

      <Spin spinning={loading && jobs.length === 0}>
        {jobs.length === 0 ? (
          <Empty description="暂无岗位" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {jobs.map((job) => (
                <Col xs={24} sm={12} lg={8} key={job.id}>
                  <Card 
                    hoverable 
                    className={styles.jobCard} 
                    onClick={() => handleCardClick(job.id)}
                    actions={[
                      <Button
                        key="bookmark"
                        type="text"
                        icon={job.isBookmarked ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                        loading={bookmarking[job.id]}
                        onClick={(e) => handleBookmark(e, job.id, job.isBookmarked || false)}
                        style={{ border: 'none' }}
                      >
                        {job.isBookmarked ? '已收藏' : '收藏'}
                      </Button>,
                      <Button
                        key="apply"
                        type={job.isApplied ? 'default' : 'primary'}
                        icon={<SendOutlined />}
                        loading={applying[job.id]}
                        disabled={job.isApplied}
                        onClick={(e) => handleApply(e, job.id)}
                        style={{ border: 'none' }}
                      >
                        {job.isApplied ? '已投递' : '立即投递'}
                      </Button>
                    ]}
                  >
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
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleLoadMore} 
                  loading={loading}
                >
                  查看更多岗位
                </Button>
              </div>
            )}
          </>
        )}
      </Spin>
    </StudentLayout>
  );
}

