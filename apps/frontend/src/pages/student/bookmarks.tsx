import { Card, List, Tag, Space, Button, Empty, Spin, message } from 'antd';
import { EnvironmentOutlined, StarFilled } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import Head from 'next/head';
import Link from 'next/link';
import { Typography } from 'antd';
import { useState, useEffect } from 'react';
import { bookmarkApi, jobApi } from '@/lib/api';

const { Title } = Typography;

interface Bookmark {
  id: string;
  jobId: string;
  job: {
    id: string;
    title: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    tags: string[];
    company: {
      id: string;
      name: string;
      verifiedBySchool: boolean;
    };
  };
  createdAt: string;
}

export default function StudentBookmarks() {
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await bookmarkApi.list();
      if (response.code === 200) {
        setBookmarks(response.data.items);
      } else {
        message.error(response.message || '获取收藏列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbookmark = async (jobId: string) => {
    try {
      const response = await jobApi.unbookmark(jobId);
      if (response.code === 200) {
        message.success('取消收藏成功');
        fetchBookmarks();
      } else {
        message.error(response.message || '取消收藏失败');
      }
    } catch (error: any) {
      message.error(error.message || '取消收藏失败');
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return '面议';
    if (min && max) return `${min / 1000}K-${max / 1000}K`;
    if (min) return `${min / 1000}K+`;
    if (max) return `≤${max / 1000}K`;
    return '面议';
  };

  return (
    <StudentLayout>
      <Head>
        <title>我的收藏 - JobVerse</title>
      </Head>

      <Title level={4}>我的收藏</Title>

      <Spin spinning={loading}>
        {bookmarks.length === 0 ? (
          <Empty description="暂无收藏的岗位" />
        ) : (
          <List
            style={{ marginTop: 16 }}
            dataSource={bookmarks}
            renderItem={(bookmark) => (
              <Card hoverable style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{bookmark.job.title}</span>
                      {bookmark.job.company.verifiedBySchool && <Tag color="blue">学校认证</Tag>}
                    </Space>
                    <Space>
                      <span>{bookmark.job.company.name}</span>
                      <span><EnvironmentOutlined /> {bookmark.job.location}</span>
                      <span style={{ color: '#52c41a' }}>{formatSalary(bookmark.job.salaryMin, bookmark.job.salaryMax)}</span>
                    </Space>
                    <Space>
                      {bookmark.job.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                    </Space>
                  </Space>
                  <Space>
                    <Button 
                      icon={<StarFilled style={{ color: '#faad14' }} />} 
                      danger
                      onClick={() => handleUnbookmark(bookmark.jobId)}
                    >
                      取消收藏
                    </Button>
                    <Link href={`/jobs/${bookmark.jobId}`}>
                      <Button type="primary">
                        查看详情
                      </Button>
                    </Link>
                  </Space>
                </div>
              </Card>
            )}
          />
        )}
      </Spin>
    </StudentLayout>
  );
}
