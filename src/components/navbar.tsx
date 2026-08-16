'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


const navItems = [
  {
    href: '/',
    label: 'Polaris QA',
    exact: true,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
  },
  {
    href: '/harvest',
    label: 'Harvest Entry',
  },
  {
    href: '/packhouse',
    label: 'Packhouse Entry',
  },
  {
    href: '/reports',
    label: 'Reports',
  },
  {
    href: '/shelf-life',
    label: 'Shelf Life',
  },
  {
  href: '/audit',
  label: 'Audit Trail',
  adminOnly: true,
},
];

type NavbarProps = {
  role?: string;
};

export default function Navbar({role}) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter(
  (item) =>
    !item.adminOnly ||
    role === 'ADMIN'
);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (item: (typeof navItems)[number]) => {
    return item.exact
      ? pathname === item.href
      : pathname === item.href ||
          pathname.startsWith(`${item.href}/`);
  };

  const handleNavigation = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo / Brand */}
        <Link
          href="/"
          className="navbar-brand"
          onClick={handleNavigation}
        >
          Polaris QA
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          {visibleNavItems
            .filter((item) => item.href !== '/')
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`navbar-link ${
                  isActive(item) ? 'active' : ''
                }`}
              >
                {item.label}
              </Link>


            ))}

            <a
  href="/logout"
  className="navbar-logout"
>
  Logout
</a>
        </div>

        {/* Mobile Hamburger */}
        <button
  type="button"
  className={`hamburger ${menuOpen ? 'open' : ''}`}
  onClick={() => setMenuOpen(!menuOpen)}
  aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={menuOpen}
>
  <span></span>
  <span></span>
  <span></span>
</button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="mobile-nav">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigation}
              className={`mobile-nav-link ${
                isActive(item) ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>

          ))}
          <a
  href="/logout"
  className="navbar-logout"
>
  Logout
</a>
        </div>
      )}



    </nav>
  );
}
