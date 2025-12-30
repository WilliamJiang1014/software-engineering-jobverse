import Head from 'next/head';
import StudentLayout from '@/components/layouts/StudentLayout';
import NotificationListPage from '@/components/NotificationListPage';

export default function StudentNotifications() {
  return (
    <StudentLayout>
      <Head>
        <title>通知中心 - JobVerse</title>
      </Head>
      <NotificationListPage role="student" />
    </StudentLayout>
  );
}
