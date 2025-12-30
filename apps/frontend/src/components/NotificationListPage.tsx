import { useEffect, useMemo, useState } from 'react';
import { Button, Card, List, message, Select, Space, Tag, Typography } from 'antd';
import { useRouter } from 'next/router';
import { notificationApi } from '@/lib/api';

const { Title, Text } = Typography;

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

type AudienceRole = 'student' | 'employer';

const typeLabels: Record<string, string> = {
  APPLY_SUCCESS: '投递成功',
  NEW_APPLICATION: '新投递',
  STATUS_UPDATE: '状态更新',
  INTERVIEW: '面试相关',
  REVIEW_RESULT: '审核结果',
  SYSTEM: '系统通知',
};

export default function NotificationListPage({ role }: { role: AudienceRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const typeOptions = useMemo(() => {
    const entries = Object.entries(typeLabels).map(([value, label]) => ({ value, label }));
    return [{ value: 'all', label: '全部类型' }, ...entries];
  }, []);

  const readOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'unread', label: '未读' },
    { value: 'read', label: '已读' },
  ];

  const notificationPath = role === 'employer' ? '/employer/notifications' : '/student/notifications';

  const resolveNotificationRoute = (notification: NotificationItem) => {
    const { resourceType, resourceId } = notification;
    if (!resourceType || !resourceId) return notificationPath;

    switch (resourceType) {
      case 'APPLICATION':
        return role === 'employer'
          ? `/employer/candidates?applicationId=${resourceId}`
          : `/student/applications/${resourceId}`;
      case 'JOB':
        return `/jobs/${resourceId}`;
      case 'INTERVIEW':
        return role === 'employer'
          ? `/employer/candidates?interviewId=${resourceId}`
          : `/student/applications`;
      case 'REVIEW':
        return role === 'employer' ? '/employer/jobs' : notificationPath;
      default:
        return notificationPath;
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      if (readFilter === 'read') {
        params.isRead = true;
      } else if (readFilter === 'unread') {
        params.isRead = false;
      }

      const res: any = await notificationApi.list(params);
      if (res.code === 200) {
        const data = res.data || {};
        const list = data.items || data.notifications || [];
        setItems(list);
        setPagination(data.pagination || { page: 1, limit: 10, total: list.length, totalPages: 1 });
      } else {
        message.error(res.message || '获取通知失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, typeFilter, readFilter]);

  const handleMarkRead = async (id: string) => {
    try {
      const res: any = await notificationApi.markRead(id);
      if (res.code === 200) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      }
    } catch (error: any) {
      message.error(error.message || '标记已读失败');
    }
  };

  const handleReadAll = async () => {
    try {
      const res: any = await notificationApi.readAll();
      if (res.code === 200) {
        setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
        message.success('已全部标记为已读');
      }
    } catch (error: any) {
      message.error(error.message || '全部标记已读失败');
    }
  };

  const handleNavigate = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }
    const target = resolveNotificationRoute(notification);
    router.push(target);
  };

  return (
    <>
      <Title level={4}>通知中心</Title>
      <Card
        style={{ marginTop: 16 }}
        title={
          <Space>
            <Select
              value={typeFilter}
              options={typeOptions}
              onChange={(value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: 140 }}
            />
            <Select
              value={readFilter}
              options={readOptions}
              onChange={(value) => {
                setReadFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: 120 }}
            />
          </Space>
        }
        extra={
          <Button onClick={handleReadAll} disabled={items.length === 0}>
            全部已读
          </Button>
        }
      >
        <List
          loading={loading}
          dataSource={items}
          locale={{ emptyText: '暂无通知' }}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => handleNavigate(item)}
              actions={[
                item.isRead ? (
                  <Tag key="read" color="default">已读</Tag>
                ) : (
                  <Button key="mark" type="link" onClick={(event) => {
                    event.stopPropagation();
                    handleMarkRead(item.id);
                  }}>
                    标记已读
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                title={
                  <Space size={8}>
                    {!item.isRead && <Tag color="processing">未读</Tag>}
                    <Text strong={!item.isRead}>{item.title}</Text>
                    {item.type && <Tag>{typeLabels[item.type] || item.type}</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">{item.content}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, page, limit: pageSize || prev.limit }));
            },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </>
  );
}
