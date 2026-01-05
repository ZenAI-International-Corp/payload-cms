'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Category, Media } from '@/payload-types'
import { useCategories } from '@/frontend/contexts/CategoriesContext'

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

export function CategoryGrid() {
  const { mainCategories } = useCategories()
  
  // 过滤出要在首页显示的分类，并按配置顺序排列
  const categories = useMemo(() => {
    return Object.keys(categoryDisplayConfig)
      .map(name => mainCategories.find((cat: Category) => cat.name === name))
      .filter((cat): cat is Category => cat !== undefined)
  }, [mainCategories])

  return (
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
          {categories.map((category) => {
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
  )
}

