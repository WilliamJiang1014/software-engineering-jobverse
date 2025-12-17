import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('登录成功');
      
      // 获取用户角色并跳转到对应页面
      const token = localStorage.getItem('accessToken');
      if (token) {
        // 解析 JWT 获取角色
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        
        switch (role) {
          case 'STUDENT':
            router.push('/student');
            break;
          case 'EMPLOYER':
            router.push('/employer');
            break;
          case 'SCHOOL_ADMIN':
            router.push('/admin');
            break;
          case 'PLATFORM_ADMIN':
            router.push('/admin');
            break;
          default:
            router.push('/');
        }
      }
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>登录 - JobVerse</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ marginBottom: 8 }}>JobVerse</Title>
            <Text type="secondary">面向高校学生的智能招聘平台</Text>
          </div>
          
          <Form
            name="login"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="邮箱" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider>测试账号</Divider>
          <div style={{ fontSize: 12, color: '#999' }}>
            <p><strong>学生：</strong>student@jobverse.test</p>
            <p><strong>企业：</strong>employer1@jobverse.test</p>
            <p><strong>学校管理员：</strong>school@jobverse.test</p>
            <p><strong>密码：</strong>jobverse123</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/">返回首页</Link>
          </div>
        </Card>
      </div>
    </>
  );
}

