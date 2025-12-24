import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout, Typography, Card, Space, Tag, Button, Spin, message } from 'antd';
import Link from 'next/link';
import { jobApi } from '@/lib/api';
import styles from '@/styles/Home.module.css';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

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
  };
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
      setError(null);
      try {
        const res: any = await jobApi.get(id);
        setJob(res.data || null);
      } catch (e: any) {
        setError(e?.message || '加载失败');
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      message.warning('请先登录再投递');
      router.push('/login');
      return;
    }
    if (user?.role && user.role !== 'STUDENT') {
      message.warning('当前账号不是学生角色，无法投递');
      return;
    }
    setApplyLoading(true);
    try {
      await jobApi.apply(id as string, {});
      message.success('投递成功');
    } catch (e: any) {
      message.error(e?.message || '投递失败');
    } finally {
      setApplyLoading(false);
    }
  };

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
          ) : error ? (
            <Text>{error}</Text>
          ) : !job ? (
            <Text>未找到岗位</Text>
          ) : (
            <>
              <Card>
                <Title level={3} style={{ marginBottom: 0 }}>{job.title}</Title>
                <Space style={{ marginTop: 8 }}>
                  <Tag>{job.location}</Tag>
                  <Tag color="green">{formatSalary(job.salaryMin, job.salaryMax)}</Tag>
                  {(job.tags || []).slice(0, 4).map(t => <Tag key={t}>{t}</Tag>)}
                </Space>
                {job.company && (
                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Text>企业：</Text>
                      <Link href={`/companies/${job.company.id}`}>
                        {job.company.name}
                      </Link>
                      {job.company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
                    </Space>
                  </div>
                )}
              </Card>
              {job.description && (
                <Card title="岗位描述" style={{ marginTop: 16 }}>
                  <Text>{job.description}</Text>
                </Card>
              )}
              {job.requirements && (
                <Card title="任职要求" style={{ marginTop: 16 }}>
                  <Text>{job.requirements}</Text>
                </Card>
              )}
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" loading={applyLoading} onClick={handleApply}>投递简历</Button>
              </Space>
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
