import type { Metadata } from 'next';
import './globals.css';
import NavHeader from '@/components/NavHeader';

export const metadata: Metadata = {
  title: 'Arora Real Tech - Property Listings in Gurugram',
  description: 'Find your dream property in Gurugram with Arora Real Tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="top-bar">
          <div className="page-container top-bar-container">
            <ul className="top-links">
              <li>
                <a href="/websites">Useful Websites</a>
              </li>
              <li>
                <a href="/maps">Gurgaon Maps</a>
              </li>
              <li>
                <a href="/important-documents">Frequently Used Documents</a>
              </li>
            </ul>
            <ul className="top-actions">
              <li>
                <a
                  className="top-button whatsapp"
                  href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on Whatsapp
                </a>
              </li>
              <li>
                <a className="top-button call" href="tel:+919811586101">
                  Call us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <NavHeader />
        {children}
      </body>
    </html>
  );
}
