import { useState } from 'react';
import { Collapse, Typography, Tag, Space, Divider, List, Alert } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined, DownOutlined, UpOutlined, BulbOutlined } from '@ant-design/icons';
import { RiskInfo } from './CompanyRiskAlert';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface EmployerRiskPanelProps {
  riskInfo: RiskInfo;
}

export default function EmployerRiskPanel({ riskInfo }: EmployerRiskPanelProps) {
  const { riskLevel, riskScore, riskMessage, riskFactors } = riskInfo;
  const [expanded, setExpanded] = useState(false);

  // 根据风险等级设置样式
  const getRiskProps = () => {
    if (riskLevel === 'high') {
      return {
        color: 'red' as const,
        icon: <ExclamationCircleOutlined />,
        text: '高风险',
        alertType: 'error' as const,
      };
    } else if (riskLevel === 'medium') {
      return {
        color: 'orange' as const,
        icon: <WarningOutlined />,
        text: '中风险',
        alertType: 'warning' as const,
      };
    } else {
      return {
        color: 'green' as const,
        icon: <CheckCircleOutlined />,
        text: '低风险',
        alertType: 'success' as const,
      };
    }
  };

  const riskProps = getRiskProps();

  // 转换措辞：将面向第三方的描述转换为面向企业负责人的描述
  const convertDescriptionForEmployer = (description: string): string => {
    return description
      .replace(/该企业有(\d+)个岗位被审核驳回/g, '您有$1个岗位被审核驳回')
      .replace(/该企业有(\d+)个岗位被标记为高风险/g, '您有$1个岗位被标记为高风险')
      .replace(/该企业尚未通过学校认证/g, '您尚未通过学校认证')
      .replace(/该企业已通过学校认证/g, '您已通过学校认证')
      .replace(/该企业/g, '您的企业')
      .replace(/该企业存在/g, '您的企业存在')
      .replace(/该企业风险/g, '您的企业风险');
  };

  // 转换风险提示信息（面向企业负责人）
  const employerRiskMessage = riskMessage
    .replace(/该企业风险较低，可放心投递/g, '您的企业风险较低，表现良好')
    .replace(/该企业存在一定风险，建议仔细了解后再投递/g, '您的企业存在一定风险，建议及时改进')
    .replace(/该企业存在较高风险，请谨慎投递/g, '您的企业存在较高风险，请尽快改进')
    .replace(/该企业/g, '您的企业')
    .replace(/该企业存在/g, '您的企业存在')
    .replace(/该企业风险/g, '您的企业风险');

  // 生成提升建议
  const generateSuggestions = () => {
    const suggestions: string[] = [];
    
    // 检查风险因素，生成针对性建议
    riskFactors.forEach((factor) => {
      if (factor.score < 0) {
        // 扣分项，生成改进建议
        switch (factor.type) {
          case '信息不完整':
            suggestions.push('完善企业信息：补充缺失的企业信息可以提高风险评分，建议填写所有必填和推荐字段');
            break;
          case '审核驳回':
            suggestions.push('提升岗位质量：仔细检查岗位描述和要求，确保内容真实、准确、完整，避免被审核驳回');
            break;
          case '高风险岗位':
            suggestions.push('整改高风险岗位：修改或删除被标记为高风险的岗位，重新提交审核');
            break;
          case '驳回率过高':
          case '驳回率较高':
            suggestions.push('降低驳回率：提高岗位发布质量，确保岗位信息符合平台规范，减少审核驳回');
            break;
          case '未认证':
            suggestions.push('申请学校认证：联系管理员申请学校认证，认证后可以降低风险评分并获得加分');
            break;
          case '近期风险':
            suggestions.push('避免近期风险：最近30天内有岗位被驳回，建议仔细检查岗位内容后再提交');
            break;
          case '新企业风险':
            suggestions.push('完善新企业信息：新注册企业应尽快完善所有企业信息，提高可信度');
            break;
        }
      }
    });

    // 如果没有扣分项，给出保持建议
    if (suggestions.length === 0) {
      suggestions.push('保持良好记录：继续保持当前状态，定期更新企业信息，确保岗位质量');
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div style={{ marginTop: 16 }}>
      <Collapse
        activeKey={expanded ? ['risk'] : []}
        onChange={(keys) => setExpanded(keys.includes('risk'))}
        ghost
      >
        <Panel
          key="risk"
          header={
            <Space>
              <Text strong>风险评估：</Text>
              <Tag color={riskProps.color} icon={riskProps.icon}>
                {riskProps.text}
              </Tag>
              <Tag color={riskProps.color}>{riskScore} 分</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {expanded ? '点击收起' : '点击查看详情'}
              </Text>
            </Space>
          }
          extra={expanded ? <UpOutlined /> : <DownOutlined />}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type={riskProps.alertType}
              message={employerRiskMessage}
              icon={riskProps.icon}
              showIcon
            />

            {riskFactors.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Title level={5}>风险因素分析</Title>
                  <List
                    size="small"
                    dataSource={riskFactors}
                    renderItem={(factor) => (
                      <List.Item>
                        <Space align="start" style={{ width: '100%' }}>
                          <Tag color={factor.score < 0 ? (factor.score <= -10 ? 'red' : 'orange') : 'green'}>
                            {factor.type}
                          </Tag>
                          <div style={{ flex: 1 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {convertDescriptionForEmployer(factor.description)}
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
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            {suggestions.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Title level={5}>
                    <BulbOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    提升建议
                  </Title>
                  <List
                    size="small"
                    dataSource={suggestions}
                    renderItem={(suggestion, index) => (
                      <List.Item>
                        <Text style={{ fontSize: 13 }}>
                          {index + 1}. {suggestion}
                        </Text>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}
          </Space>
        </Panel>
      </Collapse>
    </div>
  );
}

