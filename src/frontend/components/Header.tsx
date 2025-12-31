'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProductsDropdown } from './ProductsDropdown'
import './Header.css'

export function Header() {
  const pathname = usePathname()
  const isProductsPage = pathname?.startsWith('/products')
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false)
  const productsNavRef = useRef<HTMLLIElement>(null)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const navItems = [
    { label: 'Products', href: '/products', hasDropdown: true },
    { label: 'Solutions', href: '/solutions', hasDropdown: false },
    { label: 'Project Registration', href: '/project-registration', hasDropdown: false },
    { label: 'Cybersecurity', href: '/cybersecurity', hasDropdown: false },
    { label: 'About Us', href: '/about-us', hasDropdown: false },
    { label: 'Support', href: '/support', hasDropdown: false },
    { label: 'News', href: '/news', hasDropdown: false },
  ]

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => {
      setProductsDropdownOpen(false)
      closeTimeoutRef.current = null
    }, 300)
  }, [clearCloseTimeout])

  const handleProductsMouseEnter = useCallback(() => {
    if (isProductsPage) return // Don't show dropdown on products pages
    clearCloseTimeout()
    setProductsDropdownOpen(true)
  }, [clearCloseTimeout, isProductsPage])

  const handleProductsMouseLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  const handleDropdownMouseEnter = useCallback(() => {
    clearCloseTimeout()
    setProductsDropdownOpen(true)
  }, [clearCloseTimeout])

  const handleDropdownMouseLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link href="/" className="logo-link">
            <span className="logo-text">LOGO</span>
          </Link>
        </div>
        <nav className="header-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li
                key={item.href}
                className={`nav-item ${item.hasDropdown ? 'has-dropdown' : ''}`}
                ref={item.hasDropdown ? productsNavRef : null}
                onMouseEnter={item.hasDropdown ? handleProductsMouseEnter : undefined}
                onMouseLeave={item.hasDropdown ? handleProductsMouseLeave : undefined}
              >
                <Link href={item.href} className="nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {!isProductsPage && (
        <div
          ref={dropdownContainerRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <ProductsDropdown
            isOpen={productsDropdownOpen}
            onClose={() => {
              clearCloseTimeout()
              setProductsDropdownOpen(false)
            }}
            triggerRef={productsNavRef}
          />
        </div>
      )}
    </header>
  )
}

