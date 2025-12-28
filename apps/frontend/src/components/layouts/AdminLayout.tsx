import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  HomeOutlined, 
  AuditOutlined, 
  BarChartOutlined, 
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  SecurityScanOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  // 根据用户角色动态生成菜单项
  const allMenuItems: Array<MenuProps['items'][0] & { roles?: string[] }> = [
    { key: '/admin', icon: <HomeOutlined />, label: <Link href="/admin">工作台</Link> },
    { key: '/admin/review', icon: <AuditOutlined />, label: <Link href="/admin/review">岗位审核</Link> },
    { key: '/admin/verified', icon: <SafetyOutlined />, label: <Link href="/admin/verified">认证管理</Link> },
    { key: '/admin/risk', icon: <SecurityScanOutlined />, label: <Link href="/admin/risk">风控规则</Link>, roles: ['PLATFORM_ADMIN'] },
    { key: '/admin/audit', icon: <FileTextOutlined />, label: <Link href="/admin/audit">审计日志</Link>, roles: ['PLATFORM_ADMIN'] },
    { key: '/admin/stats', icon: <BarChartOutlined />, label: <Link href="/admin/stats">数据统计</Link> },
  ];

  // 根据用户角色过滤菜单项
  const menuItems: MenuProps['items'] = allMenuItems
    .filter(item => {
      if (!item.roles) return true; // 没有角色限制的菜单项，所有角色都可以访问
      return item.roles.includes(user?.role || '');
    })
    .map(({ roles, ...item }) => item); // 移除 roles 属性，只保留菜单项需要的属性

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      router.push('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/admin" style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            JobVerse
          </Link>
          <Text style={{ color: '#faad14', marginLeft: '12px', fontSize: '12px' }}>学校管理端</Text>
        </div>
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#faad14' }} />
            <span>{user?.name || '管理员'}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[router.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#fff', 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            borderRadius: 8
          }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

