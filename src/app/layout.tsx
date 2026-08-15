import './globals.css';
import Navbar from '@/components/navbar';
import type { Metadata, ReactNode } from 'react';

export const metadata: Metadata = {
  title: "Polaris QA Web Application",
  description: "Web application for Polaris QA Reject System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container mt-8">{children}</main>
      </body>
    </html>
  );
}
