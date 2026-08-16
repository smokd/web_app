import './globals.css';
import Navbar from '@/components/navbar';
import type { Metadata, ReactNode } from 'react';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Polaris QA Web Application",
  description: "Web application for Polaris QA Reject System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <Navbar role={session?.role}/>
        <main className="container mt-8">{children}</main>
      </body>
    </html>
  );
}
