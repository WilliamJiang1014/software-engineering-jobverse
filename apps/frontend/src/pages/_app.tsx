import type { AppProps } from 'next/app';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';

// Ant Design 主题配置
const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConfigProvider>
  );
}
