'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const PRIMARY_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/property', label: 'PROPERTIES' },
  { href: '/maps', label: 'GURUGRAM MAPS' },
  { href: '/news', label: 'NEWS' },
  {
    href: 'https://www.google.com/search?q=arora+realtech&rlz=1C1SQJL_enIN911IN911&oq=arora+realtech&aqs=chrome..69i57j69i60l3.6043j0j15&sourceid=chrome&ie=UTF-8#lrd=0x390d18c35a5291c5:0x3f9f69280634fa4b,1,,,',
    label: 'CUSTOMER REVIEWS',
    external: true,
  },
  { href: '/about-us', label: 'ABOUT US' },
  { href: '/contact-us', label: 'CONTACT US' },
];

export default function NavHeader(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const listener = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, []);

  return (
    <header className="nav-header">
      <div className="nav-header-top">
        <div className="page-container nav-top-row">
          <a href="/" className="nav-logo" aria-label="Arora Realtech home">
            <img src="/logo.svg" alt="Arora Realtech" />
          </a>
          <form className="nav-search nav-search--desktop" action="/search" method="get">
            <label className="sr-only" htmlFor="nav-search-desktop">
              Search the site
            </label>
            <input
              type="search"
              id="nav-search-desktop"
              name="keys"
              placeholder="Search"
              autoComplete="off"
            />
          </form>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span aria-hidden="true" className={`nav-toggle-bar ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>
      <div className="nav-main">
        <div className="page-container nav-main-inner">
          <ul className="nav-menu nav-menu--desktop">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : undefined)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        id="mobile-navigation"
        className={`mobile-menu ${menuOpen ? 'open' : ''}`}
      >
        <div className="mobile-menu-inner">
          <form className="nav-search nav-search--mobile" action="/search" method="get">
            <label className="sr-only" htmlFor="nav-search-mobile">
              Search the site
            </label>
            <input
              type="search"
              id="nav-search-mobile"
              name="keys"
              placeholder="Search"
              autoComplete="off"
            />
          </form>
          <ul className="nav-cta nav-cta--mobile">
            <li>
              <a
                className="nav-btn whatsapp"
                href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on Whatsapp
              </a>
            </li>
            <li>
              <a className="nav-btn call" href="tel:+919811586101">
                Call us
              </a>
            </li>
          </ul>
          <ul className="nav-menu nav-menu--mobile">
            {PRIMARY_LINKS.map((link) => (
              <li key={`mobile-${link.href}`}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : undefined)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
