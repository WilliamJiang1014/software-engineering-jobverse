import { useEffect, useMemo, useState } from 'react';
import { Card, Descriptions, Divider, Empty, message, Space, Spin, Tag, Timeline, Typography } from 'antd';
import { useRouter } from 'next/router';
import Head from 'next/head';
import StudentLayout from '@/components/layouts/StudentLayout';
import { applicationApi } from '@/lib/api';

const { Title, Text } = Typography;

interface ApplicationDetail {
  id: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  feedback?: string;
  employerNote?: string;
  job?: {
    id: string;
    title: string;
    location?: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

interface ApplicationEvent {
  id: string;
  type: string;
  actorRole: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

interface InterviewInfo {
  id: string;
  scheduledAt: string;
  mode: string;
  locationOrLink?: string | null;
  note?: string | null;
  status: string;
  studentComment?: string | null;
}

const statusMap: Record<string, { color: string; text: string }> = {
  APPLIED: { color: 'processing', text: '已投递' },
  VIEWED: { color: 'warning', text: '已查看' },
  INTERVIEWING: { color: 'blue', text: '面试中' },
  ACCEPTED: { color: 'success', text: '已录用' },
  REJECTED: { color: 'error', text: '不合适' },
};

const eventTypeLabels: Record<string, string> = {
  APPLIED: '投递成功',
  VIEWED: '企业查看',
  STATUS_CHANGED: '状态变更',
  INTERVIEW_CREATED: '面试邀请',
  INTERVIEW_RESPONDED: '面试响应',
  INTERVIEW_CANCELLED: '面试取消',
  REVIEW_RESULT: '审核结果',
};

export default function StudentApplicationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [interviews, setInterviews] = useState<InterviewInfo[]>([]);

  const latestInterview = useMemo(() => interviews[0], [interviews]);

  const fetchDetail = async (applicationId: string) => {
    setLoading(true);
    try {
      const [detailRes, eventsRes, interviewRes] = await Promise.all([
        applicationApi.get(applicationId),
        applicationApi.events(applicationId),
        applicationApi.interview(applicationId),
      ]);

      if (detailRes.code === 200) {
        setDetail(detailRes.data);
      }
      if (eventsRes.code === 200) {
        setEvents(eventsRes.data || []);
      }
      if (interviewRes.code === 200) {
        setInterviews(interviewRes.data || []);
      }
    } catch (error: any) {
      message.error(error.message || '获取投递详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof id === 'string') {
      fetchDetail(id);
    }
  }, [id]);

  const renderEventDescription = (event: ApplicationEvent) => {
    if (!event.metadata) return null;
    const metadataEntries = Object.entries(event.metadata).filter(([key]) => key !== 'interviewId');
    if (metadataEntries.length === 0) return null;

    return (
      <Space direction="vertical" size={2}>
        {metadataEntries.map(([key, value]) => (
          <Text key={key} type="secondary" style={{ fontSize: 12 }}>
            {key}: {String(value)}
          </Text>
        ))}
      </Space>
    );
  };

  return (
    <StudentLayout>
      <Head>
        <title>投递详情 - JobVerse</title>
      </Head>

      <Title level={4}>投递详情</Title>

      <Spin spinning={loading}>
        {!detail ? (
          <Card style={{ marginTop: 16 }}>
            <Empty description="暂无投递详情" />
          </Card>
        ) : (
          <>
            <Card style={{ marginTop: 16 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="岗位">
                  {detail.job?.title || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="公司">
                  {detail.job?.company?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="投递状态">
                  <Tag color={statusMap[detail.status]?.color || 'default'}>
                    {statusMap[detail.status]?.text || detail.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="投递时间">
                  {new Date(detail.appliedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(detail.updatedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card style={{ marginTop: 16 }} title="企业反馈">
              {detail.feedback ? (
                <Text>{detail.feedback}</Text>
              ) : (
                <Text type="secondary">暂无反馈</Text>
              )}
            </Card>

            <Card style={{ marginTop: 16 }} title="面试信息">
              {latestInterview ? (
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="状态">{latestInterview.status}</Descriptions.Item>
                  <Descriptions.Item label="面试时间">
                    {new Date(latestInterview.scheduledAt).toLocaleString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="方式">{latestInterview.mode}</Descriptions.Item>
                  <Descriptions.Item label="地点/链接">
                    {latestInterview.locationOrLink || '待补充'}
                  </Descriptions.Item>
                  <Descriptions.Item label="备注">
                    {latestInterview.note || '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="我的说明">
                    {latestInterview.studentComment || '无'}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">暂无面试安排</Text>
              )}
            </Card>

            <Divider />

            <Card title="投递时间线">
              {events.length === 0 ? (
                <Empty description="暂无时间线事件" />
              ) : (
                <Timeline
                  items={events.map((event) => ({
                    key: event.id,
                    color: 'blue',
                    children: (
                      <Space direction="vertical" size={4}>
                        <Text strong>{eventTypeLabels[event.type] || event.type}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(event.createdAt).toLocaleString('zh-CN')}
                        </Text>
                        {renderEventDescription(event)}
                      </Space>
                    ),
                  }))}
                />
              )}
            </Card>
          </>
        )}
      </Spin>
    </StudentLayout>
  );
}
