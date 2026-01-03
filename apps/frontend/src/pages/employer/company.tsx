import { Card, Form, Input, Button, Upload, message, Divider, Typography, Tag, Spin } from 'antd';
import { UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { employerApi } from '@/lib/api';
import EmployerRiskPanel from '@/components/EmployerRiskPanel';
import { RiskInfo } from '@/components/CompanyRiskAlert';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CompanyInfo {
  id: string;
  name: string;
  industry?: string;
  scale?: string;
  location?: string;
  description?: string;
  website?: string;
  logo?: string;
  verifiedBySchool: boolean;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  riskInfo?: RiskInfo;
}

export default function EmployerCompany() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const response = await employerApi.getCompany();
      if (response.code === 200) {
        const company = response.data;
        setCompanyInfo(company);
        form.setFieldsValue({
          name: company.name,
          industry: company.industry,
          scale: company.scale,
          location: company.location,
          website: company.website,
          description: company.description,
          contactPerson: company.contactPerson,
          contactPhone: company.contactPhone,
          contactEmail: company.contactEmail,
        });
      } else {
        message.error(response.message || '获取企业信息失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取企业信息失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await employerApi.updateCompany(values);
      if (response.code === 200) {
        message.success('企业信息更新成功');
        fetchCompanyInfo();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerLayout>
      <Head>
        <title>企业信息 - JobVerse</title>
      </Head>

      <Title level={4}>企业信息</Title>

      <Card style={{ marginTop: 16 }}>
        <Spin spinning={loading}>
          <div style={{ marginBottom: 24 }}>
            <Text strong>认证状态：</Text>
            {companyInfo?.verifiedBySchool ? (
              <>
                <Tag color="success" icon={<SafetyCertificateOutlined />} style={{ marginLeft: 8 }}>
                  已认证
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  您的企业已通过学校认证，发布的岗位将展示认证标识
                </Text>
              </>
            ) : (
              <>
                <Tag color="default" icon={<SafetyCertificateOutlined />} style={{ marginLeft: 8 }}>
                  未认证
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  您的企业尚未通过学校认证，请联系管理员进行认证
                </Text>
              </>
            )}
          </div>

          {companyInfo?.riskInfo && (
            <EmployerRiskPanel riskInfo={companyInfo.riskInfo} />
          )}
        </Spin>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: 'XX科技有限公司',
            industry: '互联网/IT',
            scale: '100-499人',
            location: '北京市海淀区中关村科技园',
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
          <Form.Item label="企业地址" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="企业官网" name="website" rules={[{ type: 'url', message: '请输入有效的网址' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="企业介绍" name="description">
            <TextArea rows={4} />
          </Form.Item>

          <Divider orientation="left">联系方式</Divider>
          
          <Form.Item label="联系人" name="contactPerson">
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item label="联系电话" name="contactPhone">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="联系邮箱" name="contactEmail" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
            <Input placeholder="请输入联系邮箱" />
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

