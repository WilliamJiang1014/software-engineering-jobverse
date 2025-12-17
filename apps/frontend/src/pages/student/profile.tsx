import { Card, Form, Input, Button, Avatar, Upload, message, Divider, Typography } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

const { Title } = Typography;

export default function StudentProfile() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('更新个人信息:', values);
    message.success('个人信息更新成功');
  };

  return (
    <StudentLayout>
      <Head>
        <title>个人中心 - JobVerse</title>
      </Head>

      <Title level={4}>个人中心</Title>

      <Card style={{ marginTop: 16, maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <Upload showUploadList={false}>
            <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>更换头像</Button>
          </Upload>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
          }}
          onFinish={onFinish}
        >
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input disabled />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="学校" name="school">
            <Input placeholder="请输入学校名称" />
          </Form.Item>
          <Form.Item label="专业" name="major">
            <Input placeholder="请输入专业" />
          </Form.Item>
          <Form.Item label="毕业年份" name="graduationYear">
            <Input placeholder="如：2025" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存修改</Button>
          </Form.Item>
        </Form>
      </Card>
    </StudentLayout>
  );
}

