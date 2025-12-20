import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  StarOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: '/student', icon: <DashboardOutlined />, label: <Link href="/student">求职概览</Link> },
    { key: '/student/jobs', icon: <SearchOutlined />, label: <Link href="/student/jobs">岗位搜索</Link> },
    { key: '/student/applications', icon: <FileTextOutlined />, label: <Link href="/student/applications">我的投递</Link> },
    { key: '/student/bookmarks', icon: <StarOutlined />, label: <Link href="/student/bookmarks">我的收藏</Link> },
    { key: '/student/profile', icon: <UserOutlined />, label: <Link href="/student/profile">个人资料</Link> },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      router.push('/login');
    } else if (key === 'profile') {
      router.push('/student/profile');
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
          <Link href="/student" style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            JobVerse
          </Link>
          <Text style={{ color: '#1890ff', marginLeft: '12px', fontSize: '12px' }}>学生端</Text>
        </div>
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.name || '用户'}</span>
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

