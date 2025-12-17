import { Card, Form, Input, Button, Upload, message, Divider, Typography, Tag } from 'antd';
import { UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EmployerCompany() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('更新企业信息:', values);
    message.success('企业信息更新成功');
  };

  return (
    <EmployerLayout>
      <Head>
        <title>企业信息 - JobVerse</title>
      </Head>

      <Title level={4}>企业信息</Title>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <Text strong>认证状态：</Text>
          <Tag color="success" icon={<SafetyCertificateOutlined />} style={{ marginLeft: 8 }}>
            已认证
          </Tag>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            您的企业已通过学校认证，发布的岗位将展示认证标识
          </Text>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: 'XX科技有限公司',
            industry: '互联网/IT',
            scale: '100-499人',
            address: '北京市海淀区中关村科技园',
            website: 'https://www.example.com',
            description: '我们是一家专注于人工智能技术研发的高科技企业...',
          }}
          onFinish={onFinish}
          style={{ maxWidth: 600 }}
        >
          <Form.Item label="企业名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所属行业" name="industry" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="企业规模" name="scale">
            <Input />
          </Form.Item>
          <Form.Item label="企业地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="企业官网" name="website">
            <Input />
          </Form.Item>
          <Form.Item label="企业介绍" name="description">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="企业Logo">
            <Upload>
              <Button icon={<UploadOutlined />}>上传Logo</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="营业执照">
            <Upload>
              <Button icon={<UploadOutlined />}>上传营业执照</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存修改</Button>
          </Form.Item>
        </Form>
      </Card>
    </EmployerLayout>
  );
}

