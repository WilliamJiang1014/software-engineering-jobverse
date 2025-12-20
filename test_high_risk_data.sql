-- 高风险标记功能测试数据
-- 如果风控规则不存在，创建一条标记为高风险的规则

-- 1. 确保存在标记为高风险的敏感词规则
INSERT INTO risk_rules (id, rule_type, content, action, enabled, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'sensitive_word',
  '刷单|刷信誉|兼职刷单|网络兼职',
  'mark',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM risk_rules 
  WHERE rule_type = 'sensitive_word' 
  AND content = '刷单|刷信誉|兼职刷单|网络兼职'
  AND action = 'mark'
);

-- 2. 查询现有规则，确认已创建
SELECT id, rule_type, content, action, enabled 
FROM risk_rules 
WHERE action = 'mark' 
ORDER BY created_at DESC;

