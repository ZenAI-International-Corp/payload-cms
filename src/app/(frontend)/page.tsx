import React from 'react'
import Link from 'next/link'
import {
  Mail,
  FileText,
  Download,
  Award,
  MapPin,
  Phone,
  Linkedin,
  Youtube,
  Twitter,
  Facebook,
  Send,
} from 'lucide-react'
import { CategoryGrid, FeaturedProducts } from '@/frontend/components'
import './home.css'

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-background-image"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-bar"></div>
            <div className="hero-badge-text">Industry Leading Security</div>
          </div>
          <h1 className="hero-title">
            Committed to Sharing the<br />
            Latest Technology in<br />
            Digital Video Recording
          </h1>
          <p className="hero-description">
            Professional Video Surveillance Equipment and Intelligent Security<br />
            Solutions.
          </p>
          <div className="hero-buttons">
            <Link href="/products" className="btn btn-primary">
              View Products
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Core Product Categories */}
      <CategoryGrid />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* About IDView */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <div className="about-label">About IDView</div>
              <h2 className="about-title">Our Mission & Values</h2>
              <div className="about-quote">
                &ldquo;To market and to promote the affordable Digital ID View brand video
                security equipment with passion and professionalism for lasting
                results.&rdquo;
              </div>
              <p className="about-description">
                IDView establishes itself as a trusted partner in the global security industry, delivering
                cost-effective, high-performance solutions for integrators and enterprise customers.
              </p>
            </div>
            <div className="certifications-grid">
              {['ISO 9001', 'NDAA Compliant', 'CE Certified', 'FCC Approved', 'RoHS', 'Quality Assured'].map(
                (cert, index) => (
                  <div key={index} className="certification-card">
                    <Award className="certification-icon" size={24} />
                    <div className="certification-name">{cert}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background"></div>
        <div className="container">
          <div className="cta-header">
            <h2 className="cta-title">Need a Reliable Video Surveillance Partner?</h2>
            <p className="cta-description">
              Our team of experts is ready to assist you with your security needs.
            </p>
          </div>
          <div className="cta-cards">
            {[
              {
                title: 'Contact Us',
                description: 'Get in touch with sales',
                buttonText: 'Send Message',
                icon: Mail,
              },
              {
                title: 'Request a Quote',
                description: 'Pricing for your project',
                buttonText: 'Get Pricing',
                icon: FileText,
              },
              {
                title: 'Support & Downloads',
                description: 'Manuals and Drivers',
                buttonText: 'Visit Support',
                icon: Download,
              },
            ].map((cta, index) => {
              const IconComponent = cta.icon
              return (
                <div key={index} className="cta-card">
                  <div className="cta-icon-wrapper">
                    <IconComponent className="cta-icon" size={30} />
                  </div>
                  <h3 className="cta-card-title">{cta.title}</h3>
                  <p className="cta-card-description">{cta.description}</p>
                  <Link href={`/${cta.title.toLowerCase().replace(/\s+/g, '-')}`} className="cta-button">
                    {cta.buttonText}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">IDView</div>
              <p className="footer-description">
                Leading provider of innovative video
                surveillance products. Empowering businesses
                with clear vision and intelligent insights.
              </p>
              <div className="footer-social">
                {[
                  { name: 'LinkedIn', icon: Linkedin, href: '#' },
                  { name: 'YouTube', icon: Youtube, href: '#' },
                  { name: 'Twitter', icon: Twitter, href: '#' },
                  { name: 'Facebook', icon: Facebook, href: '#' },
                ].map((social, index) => {
                  const IconComponent = social.icon
                  return (
                    <a key={index} href={social.href} className="social-link" aria-label={social.name}>
                      <IconComponent size={16} />
                    </a>
                  )
                })}
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4 className="footer-column-title">Quick Links</h4>
                <ul className="footer-list">
                  {['Home', 'Products', 'Product Categories', 'About Us', 'Support'].map((link, index) => (
                    <li key={index}>
                      <Link href={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="footer-link">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-column-title">Contact Us</h4>
                <ul className="footer-list">
                  <li>
                    <MapPin className="footer-icon" size={18} />
                    <span>
                      Compulan Center Inc<br />
                      12000 Ford Road, Suite 110,<br />
                      Dallas, TX 75234
                    </span>
                  </li>
                  <li>
                    <Phone className="footer-icon" size={18} />
                    <span>(972) 247-1203</span>
                  </li>
                  <li>
                    <Mail className="footer-icon" size={18} />
                    <span>sales@idview.com</span>
                  </li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-column-title">Subscribe Newsletter</h4>
                <p className="footer-newsletter-text">
                  Subscribe to our newsletter to get 10% off your first purchase.
                </p>
                <Link href="/subscribe" className="footer-subscribe-button">
                  <Send className="footer-subscribe-icon" size={16} />
                  Subscribe Now
                </Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">
              Copyright © 2025 DigitalIDview All Rights Reserved{' '}
              <a href="#" className="footer-copyright-link">
                Techsaga Corporations
              </a>
            </div>
            <div className="footer-legal">
              <Link href="/privacy-policy" className="footer-legal-link">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="footer-legal-link">
                Terms of Use
              </Link>
              <Link href="/sitemap" className="footer-legal-link">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
