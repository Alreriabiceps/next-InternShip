import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProviderWrapper from '@/components/AuthProviderWrapper';
import ErrorSuppressor from '@/components/ErrorSuppressor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InternShip - Admin Dashboard',
  description: 'Professional intern management and log tracking system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorSuppressor />
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}


