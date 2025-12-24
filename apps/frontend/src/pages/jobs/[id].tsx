import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout, Typography, Tag, Space, Button, Card, Spin, message, Avatar, Dropdown } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, StarOutlined, StarFilled, UserOutlined, LogoutOutlined, DashboardOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { jobApi } from '@/lib/api';
import styles from '@/styles/Home.module.css';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuProps } from 'antd';
import CompanyRiskAlert, { RiskInfo } from '@/components/CompanyRiskAlert';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

type JobDetail = {
  id: string;
  title: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  requirements?: string | null;
  tags?: string[];
  company?: {
    id: string;
    name: string;
    verifiedBySchool?: boolean;
    industry?: string | null;
    scale?: string | null;
    location?: string | null;
    riskInfo?: RiskInfo;
  };
  createdAt?: string;
  isBookmarked?: boolean;
  isApplied?: boolean;
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, logout } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [applying, setApplying] = useState(false);

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    if (min) return `${Math.round(min / 1000)}K+`;
    return `${Math.round((max || 0) / 1000)}K以内`;
  };

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res: any = await jobApi.get(id as string);
        const jobData = res.data || {};
        // 确保 company.riskInfo 存在
        if (jobData.company && !jobData.company.riskInfo) {
          jobData.company.riskInfo = {
            riskLevel: 'low' as const,
            riskScore: 0,
            riskMessage: '',
            riskDetails: [],
            riskFactors: [],
          };
        }
        setJob(jobData);
      } catch (e: any) {
        message.error(e?.message || '加载失败');
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    if (user?.role !== 'STUDENT') {
      message.warning('只有学生账号可以投递');
      return;
    }

    if (!job) return;
    if (job.isApplied) return;

    setApplying(true);
    try {
      const response = await jobApi.apply(job.id);
      if (response.code === 200) {
        message.success('投递成功');
        setJob({ ...job, isApplied: true });
      } else {
        message.error(response.message || '投递失败');
      }
    } catch (error: any) {
      message.error(error.message || '投递失败');
    } finally {
      setApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }
    if (!job) return;

    setBookmarking(true);
    try {
      if (job.isBookmarked) {
        await jobApi.unbookmark(job.id);
        setJob({ ...job, isBookmarked: false });
        message.success('已取消收藏');
      } else {
        await jobApi.bookmark(job.id);
        setJob({ ...job, isBookmarked: true });
        message.success('收藏成功');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setBookmarking(false);
    }
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

  return (
    <>
      <Head>
        <title>{job?.title || '岗位详情'} - JobVerse</title>
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
                <Button type="link" style={{ color: '#fff' }} href="/">首页</Button>
                <Button type="link" style={{ color: '#fff' }} href="/login">登录</Button>
              </>
            )}
          </Space>
        </Header>
        <Content className={styles.content}>
          <div style={{ maxWidth: 900, margin: '24px auto' }}>
            <div style={{ marginBottom: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回上一页</Button>
            </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : job ? (
            <Card>
              <div className={styles.jobHeader}>
                <Title level={3} className={styles.jobTitle}>{job.title}</Title>
                <Text type="success" strong>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
              </div>
              <div className={styles.jobCompany}>
                <Space size="middle">
                  <Text strong>
                    <Link href={`/companies/${job.company?.id}`} style={{ color: 'inherit' }}>
                        {job.company?.name ?? '未命名企业'}
                    </Link>
                  </Text>
                  {job.company?.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
                  {job.company?.riskInfo && (
                    <CompanyRiskAlert riskInfo={job.company.riskInfo} companyName={job.company.name} />
                  )}
                  {job.company?.industry && <Tag>{job.company.industry}</Tag>}
                  {job.company?.scale && <Tag>{job.company.scale}</Tag>}
                </Space>
              </div>
              <div className={styles.jobMeta}>
                <Space size="middle">
                  <Text type="secondary"><EnvironmentOutlined /> {job.location}</Text>
                  {job.company?.location && <Text type="secondary">办公地：{job.company.location}</Text>}
                </Space>
              </div>
              <div className={styles.jobTags}>
                {(job.tags ?? []).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                {isAuthenticated && user?.role === 'STUDENT' && (
                  <Button
                    type="primary"
                    loading={applying}
                    onClick={handleApply}
                    disabled={job.isApplied}
                  >
                    {job.isApplied ? '已投递' : '立即投递'}
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    type={job.isBookmarked ? 'default' : 'primary'}
                    icon={job.isBookmarked ? <StarFilled /> : <StarOutlined />}
                    loading={bookmarking}
                    onClick={handleBookmark}
                  >
                    {job.isBookmarked ? '已收藏' : '收藏'}
                  </Button>
                )}
                {!isAuthenticated && (
                  <>
                    <Button type="primary" onClick={handleApply}>
                      立即投递
                    </Button>
                    <Button
                      icon={<StarOutlined />}
                      onClick={() => {
                        message.warning('请先登录');
                        router.push('/login');
                      }}
                    >
                      收藏
                    </Button>
                  </>
                )}
              </div>
              <div style={{ marginTop: 24 }}>
                <Title level={4}>岗位描述</Title>
                <Paragraph>{job.description || '暂无描述'}</Paragraph>
              </div>
              <div style={{ marginTop: 16 }}>
                <Title level={4}>任职要求</Title>
                <Paragraph>{job.requirements || '暂无要求'}</Paragraph>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
               <Text>未找到岗位</Text>
            </div>
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
