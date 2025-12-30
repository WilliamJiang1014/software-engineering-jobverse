import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const REFRESH_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const targetPath = user?.role === 'EMPLOYER' ? '/employer/notifications' : '/student/notifications';

  const fetchUnreadCount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await notificationApi.unreadCount();
      if (res.code === 200) {
        setCount(res.data.count || 0);
      }
    } catch (error) {
      // 忽略未读数错误，避免打断页面
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <Link href={targetPath} aria-label="通知中心">
      <Tooltip title="通知中心">
        <Badge count={count} overflowCount={99} size="small" offset={[0, 4]}>
          <Button
            type="text"
            loading={loading}
            icon={<BellOutlined style={{ color: '#fff', fontSize: 18 }} />}
          />
        </Badge>
      </Tooltip>
    </Link>
  );
}
