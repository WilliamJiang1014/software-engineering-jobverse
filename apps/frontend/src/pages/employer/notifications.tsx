import Head from 'next/head';
import EmployerLayout from '@/components/layouts/EmployerLayout';
import NotificationListPage from '@/components/NotificationListPage';

export default function EmployerNotifications() {
  return (
    <EmployerLayout>
      <Head>
        <title>通知中心 - JobVerse</title>
      </Head>
      <NotificationListPage role="employer" />
    </EmployerLayout>
  );
}
