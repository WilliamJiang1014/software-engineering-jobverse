import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  HomeOutlined, 
  FileAddOutlined, 
  TeamOutlined, 
  BankOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface EmployerLayoutProps {
  children: React.ReactNode;
}

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: '/employer', icon: <HomeOutlined />, label: <Link href="/employer">工作台</Link> },
    { key: '/employer/jobs', icon: <FileAddOutlined />, label: <Link href="/employer/jobs">岗位管理</Link> },
    { key: '/employer/candidates', icon: <TeamOutlined />, label: <Link href="/employer/candidates">候选人管理</Link> },
    { key: '/employer/company', icon: <BankOutlined />, label: <Link href="/employer/company">企业信息</Link> },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'company', icon: <BankOutlined />, label: '企业信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      router.push('/login');
    } else if (key === 'company') {
      router.push('/employer/company');
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
          <Link href="/employer" style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            JobVerse
          </Link>
          <Text style={{ color: '#52c41a', marginLeft: '12px', fontSize: '12px' }}>企业端</Text>
        </div>
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
            <span>{user?.name || '企业用户'}</span>
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

