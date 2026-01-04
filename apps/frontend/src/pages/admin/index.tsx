import { Card, Row, Col, Statistic, Typography, List, Tag, Button, Spin, message } from 'antd';
import { AuditOutlined, SafetyOutlined, FileTextOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

const { Title, Text } = Typography;

interface PendingJob {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface DashboardStats {
  pendingJobs: number;
  approvedJobs: number;
  totalJobs: number;
  totalUsers: number;
  verifiedCompanies?: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [recentActions, setRecentActions] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // 每30秒自动刷新一次数据
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 根据用户角色决定调用哪些 API
      const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
      
      // 构建 API 调用列表
      const apiCalls: Promise<any>[] = [
        adminApi.audit.getStats(),
        adminApi.audit.getLogs({ page: 1, limit: 5 }),
      ];
      
      // 只有学校管理员才调用审核相关 API
      if (isSchoolAdmin) {
        apiCalls.push(adminApi.review.getPendingJobs({ page: 1, limit: 5 }));
      }
      
      // 使用 Promise.allSettled 确保即使某个 API 失败也不影响其他 API
      const results = await Promise.allSettled(apiCalls);
      
      // 处理统计数据
      if (results[0].status === 'fulfilled') {
        if (results[0].value.code === 200) {
          setStats({
            pendingJobs: results[0].value.data.pendingJobs || 0,
            approvedJobs: results[0].value.data.approvedJobs || 0,
            totalJobs: results[0].value.data.totalJobs || 0,
            totalUsers: results[0].value.data.totalUsers || 0,
            verifiedCompanies: results[0].value.data.verifiedCompanies || 0,
          });
        } else {
          console.error('获取统计数据失败:', results[0].value.message || '未知错误');
        }
      } else {
        console.error('获取统计数据请求失败:', results[0].reason);
      }
      
      // 处理审计日志
      if (results[1].status === 'fulfilled') {
        if (results[1].value.code === 200) {
          setRecentActions(results[1].value.data.items || []);
        } else {
          console.error('获取审计日志失败:', results[1].value.message || '未知错误');
        }
      } else {
        console.error('获取审计日志请求失败:', results[1].reason);
      }
      
      // 处理待审核岗位（仅学校管理员）
      if (isSchoolAdmin && results[2]) {
        if (results[2].status === 'fulfilled' && results[2].value.code === 200) {
          setPendingJobs(results[2].value.data.items || []);
        } else if (results[2].status === 'fulfilled') {
          console.error('获取待审核岗位失败:', results[2].value.message || '未知错误');
          setPendingJobs([]);
        } else {
          console.error('获取待审核岗位请求失败:', results[2].reason);
          setPendingJobs([]);
        }
      } else if (!isSchoolAdmin) {
        // 平台管理员不显示待审核岗位
        setPendingJobs([]);
      }
    } catch (error: any) {
      console.error('获取工作台数据失败:', error);
      message.error('获取工作台数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  const formatActionText = (action: string, details?: any) => {
    const actionMap: Record<string, string> = {
      'JOB_APPROVE': '审核通过',
      'JOB_REJECT': '审核驳回',
      'JOB_CREATE': '创建岗位',
      'COMPANY_VERIFY': '认证企业',
      'COMPANY_UNVERIFY': '取消认证',
    };
    return actionMap[action] || action;
  };

  const formatResourceName = (log: AuditLog) => {
    if (log.details?.title) return log.details.title;
    if (log.details?.name) return log.details.name;
    if (log.resourceId) return log.resourceId;
    return '未知';
  };

  return (
    <AdminLayout>
      <Head>
        <title>管理工作台 - JobVerse</title>
      </Head>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>欢迎回来，{user?.name || '管理员'}！</Title>
          <Text type="secondary">这是您的管理概览</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchDashboardData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待审核岗位" 
                value={stats?.pendingJobs || 0} 
                prefix={<AuditOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已认证企业" 
                value={stats?.verifiedCompanies || 0} 
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="在线岗位" 
                value={stats?.approvedJobs || 0} 
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="注册用户" 
                value={stats?.totalUsers || 0} 
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 24 }}>
          {/* 待审核 - 仅学校管理员显示 */}
          {user?.role === 'SCHOOL_ADMIN' && (
            <Col span={12}>
              <Card 
                title="待审核岗位" 
                extra={<Link href="/admin/review">查看全部</Link>}
              >
                {pendingJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无待审核岗位
                  </div>
                ) : (
                  <List
                    dataSource={pendingJobs}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Link key="review" href={`/admin/review`}>
                            <Button type="link">审核</Button>
                          </Link>
                        ]}
                      >
                        <List.Item.Meta
                          title={item.title}
                          description={`${item.company.name} · 提交于 ${new Date(item.createdAt).toLocaleString('zh-CN')}`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          )}

          {/* 最近操作 */}
          <Col span={user?.role === 'SCHOOL_ADMIN' ? 12 : 24}>
            <Card title="最近操作">
              {recentActions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无操作记录
                </div>
              ) : (
                <List
                  dataSource={recentActions}
                  renderItem={(item) => {
                    const actionText = formatActionText(item.action, item.details);
                    const resourceName = formatResourceName(item);
                    const isApproved = item.action === 'JOB_APPROVE';
                    const isRejected = item.action === 'JOB_REJECT';
                    
                    return (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <span>
                              <Tag color={isApproved ? 'success' : isRejected ? 'error' : 'blue'}>
                                {actionText}
                              </Tag>
                              {resourceName}
                            </span>
                          }
                          description={`${item.user?.name || '系统'} · ${new Date(item.createdAt).toLocaleString('zh-CN')}`}
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </AdminLayout>
  );
}
