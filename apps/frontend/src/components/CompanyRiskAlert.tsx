import { useState } from 'react';
import { Tag, Modal, Typography, Space, Divider } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface RiskInfo {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskMessage: string;
  riskDetails: string[];
  riskFactors: Array<{
    type: string;
    description: string;
    score: number;
  }>;
}

interface CompanyRiskAlertProps {
  riskInfo: RiskInfo;
  companyName?: string;
}

export default function CompanyRiskAlert({ riskInfo, companyName }: CompanyRiskAlertProps) {
  const { riskLevel, riskScore, riskMessage, riskFactors } = riskInfo;
  const [modalVisible, setModalVisible] = useState(false);

  // 根据风险等级设置标签样式
  const getTagProps = () => {
    if (riskLevel === 'high') {
      return {
        color: 'red' as const,
        icon: <ExclamationCircleOutlined />,
        text: '高风险',
      };
    } else if (riskLevel === 'medium') {
      return {
        color: 'orange' as const,
        icon: <WarningOutlined />,
        text: '中风险',
      };
    } else {
      return {
        color: 'green' as const,
        icon: <CheckCircleOutlined />,
        text: '低风险',
      };
    }
  };

  const tagProps = getTagProps();

  return (
    <>
      <Tag
        color={tagProps.color}
        icon={tagProps.icon}
        style={{ cursor: 'pointer' }}
        onClick={() => setModalVisible(true)}
      >
        {tagProps.text}
      </Tag>
      <Modal
        title="企业风险评估详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>风险等级：</Text>
            <Tag color={tagProps.color} icon={tagProps.icon} style={{ marginLeft: 8 }}>
              {tagProps.text}
            </Tag>
          </div>
          <div>
            <Text strong>风险评分：</Text>
            <Tag color={tagProps.color} style={{ marginLeft: 8 }}>
              {riskScore} 分
            </Tag>
          </div>
          <div>
            <Text strong>风险提示：</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>{riskMessage}</Text>
          </div>
          {riskFactors.length > 0 && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>风险因素：</Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {riskFactors.map((factor, index) => (
                    <div key={index} style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
                      <Space align="start" wrap style={{ width: '100%' }}>
                        <Tag color={factor.score < 0 ? (factor.score <= -10 ? 'red' : 'orange') : 'green'}>
                          {factor.type}
                        </Tag>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {factor.description}
                          </Text>
                          {factor.score !== 0 && (
                            <Text
                              type={factor.score < 0 ? 'danger' : 'success'}
                              style={{ fontSize: 13, marginLeft: 8, fontWeight: 'bold' }}
                            >
                              {factor.score > 0 ? '+' : ''}{factor.score}分
                            </Text>
                          )}
                        </div>
                      </Space>
                    </div>
                  ))}
                </Space>
              </div>
            </>
          )}
        </Space>
      </Modal>
    </>
  );
}

