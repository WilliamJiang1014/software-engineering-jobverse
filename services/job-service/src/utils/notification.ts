/**
 * 通知服务调用辅助函数
 * 用于 job-service 调用 user-service 创建通知
 */

import { NotificationType } from '@jobverse/shared';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * 创建通知（调用 user-service）
 * 失败时仅记录错误，不影响主流程
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const response = await fetch(`${USER_SERVICE_URL}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`创建通知失败 (${response.status}):`, errorText);
    }
  } catch (error) {
    // 通知创建失败不应影响主流程，仅记录错误
    console.error('调用通知服务失败:', error);
  }
}

