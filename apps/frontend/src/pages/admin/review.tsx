import { Table, Tag, Card, Button, Space, Typography, Modal, Input, message, Spin } from 'antd';

const { Text } = Typography;
const { Paragraph } = Typography;
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/lib/api';

const { Title } = Typography;
const { TextArea } = Input;

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    verifiedBySchool: boolean;
  };
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  isHighRisk?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobDetail extends Job {
  description?: string;
  requirements?: string;
  tags?: string[];
  expiresAt?: string;
  reviews?: Array<{
    id: string;
  status: string;
    comment?: string;
    reviewedAt?: string;
    reviewer?: {
      id: string;
      name?: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export default function AdminReview() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPendingJobs();
  }, [pagination.page, pagination.limit]);

  const fetchPendingJobs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.review.getPendingJobs({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.code === 200) {
        setJobs(response.data.items);
        setPagination(response.data.pagination);
      } else {
        message.error(response.message || '获取待审核列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取待审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (job: Job) => {
    Modal.confirm({
      title: '审核通过',
      content: `确定要通过「${job.title}」的审核吗？`,
      onOk: async () => {
        try {
          const response = await adminApi.review.reviewJob(job.id, {
            status: 'APPROVED',
          });
          if (response.code === 200) {
            message.success('审核已通过');
            fetchPendingJobs();
          } else {
            message.error(response.message || '审核失败');
          }
        } catch (error: any) {
          message.error(error.message || '审核失败');
        }
      },
    });
  };

  const handleReject = (job: Job) => {
    setSelectedJob(job);
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      message.error('请输入驳回原因');
      return;
    }
    if (!selectedJob) return;

    try {
      const response = await adminApi.review.reviewJob(selectedJob.id, {
        status: 'REJECTED',
        comment: rejectReason,
      });
      if (response.code === 200) {
        message.success('已驳回');
        setRejectModalVisible(false);
        setRejectReason('');
        setSelectedJob(null);
        fetchPendingJobs();
      } else {
        message.error(response.message || '驳回失败');
      }
    } catch (error: any) {
      message.error(error.message || '驳回失败');
    }
  };

  const handleViewDetail = async (job: Job) => {
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const response = await adminApi.review.getJobDetail(job.id);
      if (response.code === 200) {
        setJobDetail(response.data);
      } else {
        message.error(response.message || '获取岗位详情失败');
        setDetailModalVisible(false);
      }
    } catch (error: any) {
      message.error(error.message || '获取岗位详情失败');
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return '面议';
    if (min && max) return `${min / 1000}K-${max / 1000}K`;
    if (min) return `${min / 1000}K+`;
    if (max) return `≤${max / 1000}K`;
    return '面议';
  };

  const columns: ColumnsType<Job> = [
    { 
      title: '岗位名称', 
      dataIndex: 'title', 
      key: 'title',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.isHighRisk && <Tag color="red">高风险</Tag>}
        </Space>
      ),
    },
    { 
      title: '企业', 
      key: 'company',
      render: (_, record) => (
        <Space>
          <span>{record.company.name}</span>
          {record.company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
        </Space>
      ),
    },
    { 
      title: '薪资', 
      key: 'salary',
      render: (_, record) => formatSalary(record.salaryMin, record.salaryMax),
    },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { 
      title: '提交时间', 
      key: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button 
            type="link" 
            icon={<CheckOutlined />} 
            style={{ color: '#52c41a' }}
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button 
            type="link" 
            icon={<CloseOutlined />} 
            danger
            onClick={() => handleReject(record)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>岗位审核 - JobVerse</title>
      </Head>

      <Title level={4}>岗位审核</Title>
      <div style={{ marginBottom: 16 }}>
        <Tag color="warning">待审核: {pagination.total}</Tag>
      </div>
      
      <Card>
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={jobs}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, page, limit: pageSize });
              },
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="驳回岗位"
        open={rejectModalVisible}
        onOk={submitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <p>岗位：{selectedJob?.title}</p>
        <p>企业：{selectedJob?.company.name}</p>
        <TextArea
          placeholder="请输入驳回原因..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
        />
      </Modal>

      <Modal
        title="岗位详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setJobDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setJobDetail(null);
          }}>
            关闭
          </Button>,
          <Button 
            key="approve" 
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => {
              if (jobDetail) {
                setDetailModalVisible(false);
                handleApprove(jobDetail);
              }
            }}
          >
            通过审核
          </Button>,
          <Button 
            key="reject" 
            danger
            onClick={() => {
              if (jobDetail) {
                setDetailModalVisible(false);
                handleReject(jobDetail);
              }
            }}
          >
            驳回
          </Button>,
        ]}
        width={800}
      >
        <Spin spinning={detailLoading}>
          {jobDetail && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {jobDetail.title}
                  {jobDetail.isHighRisk && <Tag color="red" style={{ marginLeft: 8 }}>高风险</Tag>}
                </Title>
                <Space size="large" style={{ marginBottom: 16 }}>
                  <span><strong>企业：</strong>{jobDetail.company.name}</span>
                  {jobDetail.company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
                  <span><strong>地点：</strong>{jobDetail.location}</span>
                  <span><strong>薪资：</strong>{formatSalary(jobDetail.salaryMin, jobDetail.salaryMax)}</span>
                </Space>
              </div>

              {jobDetail.description && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>岗位描述</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{jobDetail.description}</Paragraph>
                </div>
              )}

              {jobDetail.requirements && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>任职要求</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{jobDetail.requirements}</Paragraph>
                </div>
              )}

              {jobDetail.tags && jobDetail.tags.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>标签</Title>
                  <Space wrap>
                    {jobDetail.tags.map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <Title level={5}>审核历史</Title>
                {jobDetail.reviews && jobDetail.reviews.length > 0 ? (
                  <div>
                    {jobDetail.reviews.map((review) => (
                      <div key={review.id} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <Space>
                          <Tag color={review.status === 'APPROVED' ? 'green' : review.status === 'REJECTED' ? 'red' : 'orange'}>
                            {review.status === 'APPROVED' ? '通过' : review.status === 'REJECTED' ? '驳回' : '待审核'}
                          </Tag>
                          <span>审核人：{review.reviewer?.name || review.reviewer?.email || '未知'}</span>
                          {review.reviewedAt && (
                            <span>审核时间：{new Date(review.reviewedAt).toLocaleString('zh-CN')}</span>
                          )}
                        </Space>
                        {review.comment && (
                          <div style={{ marginTop: 4, color: '#666' }}>
                            备注：{review.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">暂无审核记录</Text>
                )}
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Space>
                  <Text type="secondary">创建时间：{new Date(jobDetail.createdAt).toLocaleString('zh-CN')}</Text>
                  <Text type="secondary">更新时间：{new Date(jobDetail.updatedAt).toLocaleString('zh-CN')}</Text>
                  {jobDetail.expiresAt && (
                    <Text type="secondary">有效期至：{new Date(jobDetail.expiresAt).toLocaleString('zh-CN')}</Text>
                  )}
                </Space>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </AdminLayout>
  );
}
