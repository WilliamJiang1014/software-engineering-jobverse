import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout, Typography, Card, Row, Col, Tag, Space, List, Spin, Button, Descriptions } from 'antd';
import { companyApi } from '@/lib/api';
import Link from 'next/link';
import styles from '@/styles/Home.module.css';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

type Company = {
  id: string;
  name: string;
  industry?: string | null;
  scale?: string | null;
  location?: string | null;
  description?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  verifiedBySchool?: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    currentOpenJobs: number;
    totalJobs: number;
  };
};

type CompanyJob = {
  id: string;
  title: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  _count?: { applications: number };
};

export default function CompanyDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [openJobs, setOpenJobs] = useState<CompanyJob[]>([]);
  const [historyJobs, setHistoryJobs] = useState<CompanyJob[]>([]);

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    if (min) return `${Math.round(min / 1000)}K+`;
    return `${Math.round((max || 0) / 1000)}K以内`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [cRes, jRes]: any = await Promise.all([
          companyApi.get(id),
          companyApi.jobs(id),
        ]);
        setCompany(cRes.data);
        setOpenJobs(jRes.data.items || []);
        setHistoryJobs(jRes.data.historyItems || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <>
      <Head>
        <title>{company?.name || '企业详情'} - JobVerse</title>
      </Head>
      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.logo}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>JobVerse</Title>
          </div>
        </Header>
        <Content className={styles.content}>
          <div style={{ maxWidth: 1000, margin: '24px auto' }}>
            <div style={{ marginBottom: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回上一页</Button>
            </div>
            {loading ? (
              <Spin />
            ) : !company ? (
              <Text>未找到企业</Text>
            ) : (
            <>
              <Card>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={3} style={{ marginBottom: 0 }}>{company.name}</Title>
                    <Space>
                      {company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
                      {company.industry && <Tag>{company.industry}</Tag>}
                      {company.scale && <Tag>{company.scale}</Tag>}
                      {company.location && <Tag>{company.location}</Tag>}
                    </Space>
                  </Col>
                  <Col>
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer">官网</a>
                    )}
                  </Col>
                </Row>
                {company.description && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                    {company.description}
                  </Text>
                )}
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>当前在招</Title>
                      <Text strong>{company.stats?.currentOpenJobs ?? 0}</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>历史发布</Title>
                      <Text strong>{company.stats?.historyPublishedJobs ?? 0}</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>最近更新</Title>
                      <Text strong>{new Date(company.updatedAt).toLocaleDateString()}</Text>
                    </Card>
                  </Col>
                </Row>
              </Card>

              {(company.contactPerson || company.contactPhone || company.contactEmail) && (
                <Card title="联系方式" style={{ marginTop: 16 }}>
                  <Descriptions column={3}>
                    {company.contactPerson && <Descriptions.Item label="联系人">{company.contactPerson}</Descriptions.Item>}
                    {company.contactPhone && <Descriptions.Item label="联系电话">{company.contactPhone}</Descriptions.Item>}
                    {company.contactEmail && <Descriptions.Item label="联系邮箱">{company.contactEmail}</Descriptions.Item>}
                  </Descriptions>
                </Card>
              )}

              <Card title="正在招聘" style={{ marginTop: 16 }}>
                <List
                  dataSource={openJobs}
                  renderItem={(job) => (
                    <List.Item actions={[<Link key="view" href={`/jobs/${job.id}`}>查看</Link>]}>
                      <List.Item.Meta
                        title={job.title}
                        description={
                          <Space>
                            <Text>{job.location}</Text>
                            <Text>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
                            <Text>投递数 {job._count?.applications || 0}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>

              {historyJobs.length > 0 && (
                <Card title="历史岗位" style={{ marginTop: 16 }}>
                  <List
                    dataSource={historyJobs}
                    renderItem={(job) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Space><Text>{job.title}</Text><Tag>历史</Tag></Space>}
                          description={
                            <Space>
                              <Text>{job.location}</Text>
                              <Text>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
                              <Text type="secondary">更新时间 {new Date(job.updatedAt || job.createdAt).toLocaleDateString()}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
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
