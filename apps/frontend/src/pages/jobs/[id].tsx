import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout, Typography, Tag, Space, Button, Card, Spin, message } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { jobApi } from '@/lib/api';
import styles from '@/styles/Home.module.css';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

type JobDetail = {
  id: string;
  title: string;
  company?: {
    id: string;
    name: string;
    verifiedBySchool?: boolean;
    industry?: string | null;
    scale?: string | null;
    location?: string | null;
  };
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  requirements?: string | null;
  tags?: string[];
  createdAt?: string;
};

const formatSalary = (min?: number | null, max?: number | null) => {
  if (!min && !max) return '薪资面议';
  if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
  if (min) return `${Math.round(min / 1000)}K+`;
  return `${Math.round((max || 0) / 1000)}K以内`;
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJob = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await jobApi.get(jobId);
      setJob(res.data);
    } catch (err) {
      console.error(err);
      message.error('岗位不存在或已下线');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof id === 'string') {
      fetchJob(id);
    }
  }, [id]);

  return (
    <>
      <Head>
        <title>{job ? `${job.title} - JobVerse` : '岗位详情 - JobVerse'}</title>
      </Head>
      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.logo}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>JobVerse</Title>
          </div>
          <Space>
            <Button type="link" style={{ color: '#fff' }} href="/">首页</Button>
            <Button type="link" style={{ color: '#fff' }} href="/login">登录</Button>
          </Space>
        </Header>

        <Content className={styles.content}>
          <div style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              返回
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
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
                  <Text strong>{job.company?.name ?? '未命名企业'}</Text>
                  {job.company?.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
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
            <Card>
              <Text>未找到岗位信息</Text>
            </Card>
          )}
        </Content>

        <Footer className={styles.footer}>
          <Text type="secondary">JobVerse ©{new Date().getFullYear()}</Text>
        </Footer>
      </Layout>
    </>
  );
}
