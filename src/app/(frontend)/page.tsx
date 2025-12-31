import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
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
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Product, Media, Category } from '@/payload-types'
import './home.css'

// 分类显示配置 - 将数据库分类映射到首页展示
// image 和 description 作为后备值，优先使用数据库中存储的值
const categoryDisplayConfig: Record<string, {
  displayName: string
  description: string
  image: string // 后备图片，当数据库中没有图片时使用
}> = {
  'IP Cameras': {
    displayName: 'IP Cameras',
    description: 'High-resolution network cameras delivering crisp, clear video surveillance over IP networks.',
    image: 'https://placehold.co/467x400',
  },
  'NVR': {
    displayName: 'NVR Systems',
    description: 'Robust Network Video Recorders designed for seamless management and storage of IP camera footage.',
    image: 'https://placehold.co/468x401',
  },
  'Analog Camera': {
    displayName: 'Analog Cameras',
    description: 'Cost-effective analog security cameras providing reliable performance for traditional coaxial systems.',
    image: 'https://placehold.co/467x234',
  },
  'DVR': {
    displayName: 'DVR',
    description: 'Digital Video Recorders offering dependable recording solutions for analog surveillance setups.',
    image: 'https://placehold.co/471x404',
  },
  'IP PVM': {
    displayName: 'IP PVM & Displays',
    description: 'Public View Monitors and professional displays designed for deterrence and high-quality viewing.',
    image: 'https://placehold.co/467x234',
  },
  'Others': {
    displayName: 'Others',
    description: 'Essential accessories including PoE Switches, UPS power supplies, and mounting brackets.',
    image: 'https://placehold.co/470x403',
  },
}

export default async function HomePage() {
  const payload = await getPayload({ config })
  
  // 获取主分类（用于 Core Product Categories）
  const { docs: mainCategories } = await payload.find({
    collection: 'categories',
    where: {
      type: { equals: 'product-category' },
      parent: { exists: false },
    },
    limit: 100,
    depth: 1, // 包含关联数据（如图片）
  })

  // 过滤出要在首页显示的分类，并按配置顺序排列
  const displayCategories = Object.keys(categoryDisplayConfig)
    .map(name => mainCategories.find(cat => cat.name === name))
    .filter((cat): cat is Category => cat !== undefined)
  
  // 获取 4 个产品用于 Featured Products 展示
  const { docs: featuredProducts } = await payload.find({
    collection: 'products',
    limit: 4,
    depth: 1, // 包含关联数据（如图片）
    sort: '-createdAt', // 按创建时间倒序，展示最新产品
  })
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
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Product Categories</h2>
            <div className="section-underline"></div>
            <p className="section-description">
              Comprehensive security hardware for every surveillance need.
            </p>
          </div>
          <div className="categories-grid">
            {displayCategories.map((category) => {
              const config = categoryDisplayConfig[category.name]
              if (!config) return null
              
              // 获取分类图片：优先使用数据库图片，否则使用配置的默认图片
              const categoryImage = category.image && typeof category.image === 'object'
                ? (category.image as Media).url
                : null
              const imageUrl = categoryImage || config.image
              
              // 使用数据库描述或配置的描述
              const description = category.description || config.description
              
              return (
                <Link 
                  key={category.id} 
                  href={`/products?category=${category.id}`}
                  className="category-card"
                >
                  <div className="category-image-wrapper">
                    <img 
                      src={imageUrl} 
                      alt={config.displayName} 
                      className="category-image" 
                    />
                  </div>
                  <div className="category-content">
                    <div className="category-title-wrapper">
                      <h3 className="category-title">{config.displayName}</h3>
                      <ArrowRight className="category-arrow-icon" size={16} />
                    </div>
                    <p className="category-description">{description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <div className="section-underline"></div>
              <p className="section-description">
                Top-tier security equipment for critical applications.
              </p>
            </div>
            <Link href="/products" className="view-all-link">
              View All Products
              <ArrowRight className="arrow-icon" size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {featuredProducts.map((product: Product) => {
              // 获取产品的第一张图片作为特色图片
              const firstImage = product.gallery && product.gallery.length > 0 
                ? product.gallery[0].image 
                : null
              const imageUrl = firstImage && typeof firstImage === 'object'
                ? (firstImage as Media).url
                : 'https://placehold.co/537x460'
              
              // 获取主分类名称用作标签
              const categoryName = product.mainCategory && typeof product.mainCategory === 'object'
                ? product.mainCategory.name
                : ''
              
              // 判断是否为新产品（创建时间在 30 天内）
              const isNew = product.createdAt 
                ? new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                : false
              
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    {isNew && <div className="product-badge">NEW</div>}
                    <img 
                      src={imageUrl || 'https://placehold.co/537x460'} 
                      alt={product.model} 
                      className="product-image" 
                    />
                  </div>
                  <div className="product-content">
                    <h3 className="product-name">{product.model}</h3>
                    <div className="product-tags">
                      {categoryName && (
                        <span className="product-tag">{categoryName}</span>
                      )}
                      {product.description && (
                        <span className="product-tag">
                          {product.description.length > 20 
                            ? product.description.substring(0, 20) + '...' 
                            : product.description}
                        </span>
                      )}
                    </div>
                    <Link href={`/products/${product.slug}`} className="product-link">
                      Learn More
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

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
