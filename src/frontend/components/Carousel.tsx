'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media } from '@/payload-types'
import './Carousel.css'

// 轮播图数据类型
export interface CarouselSlide {
  id: string
  title: string
  image: string | Media
  altText?: string | null
  isClickable: boolean
  linkUrl?: string | null
  linkTarget?: '_self' | '_blank' | null
  order: number
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlayInterval?: number // 自动播放间隔（毫秒）
  showControls?: boolean // 是否显示左右控制按钮
  showIndicators?: boolean // 是否显示底部指示器
}

export function Carousel({
  slides,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // 下一张
  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length)
  }, [slides.length])

  // 上一张
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length)
  }

  // 跳转到指定索引
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 自动播放
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [slides.length, isHovered, autoPlayInterval, goToNext])

  // 如果没有轮播图，不渲染
  if (!slides || slides.length === 0) {
    return null
  }

  const currentSlide = slides[currentIndex]
  const imageUrl =
    typeof currentSlide.image === 'string' ? currentSlide.image : currentSlide.image?.url || ''

  // 渲染轮播图内容
  const renderSlideContent = () => {
    const content = (
      <Image
        src={imageUrl}
        alt={currentSlide.altText || currentSlide.title}
        fill
        priority={currentIndex === 0}
        className="carousel-image"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1536px"
      />
    )

    // 如果可以点击，包裹在 a 标签中
    if (currentSlide.isClickable && currentSlide.linkUrl) {
      return (
        <a
          href={currentSlide.linkUrl}
          target={currentSlide.linkTarget || '_self'}
          rel={currentSlide.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
          className="carousel-link"
          aria-label={currentSlide.altText || currentSlide.title}
        >
          {content}
        </a>
      )
    }

    return content
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-container">
        {renderSlideContent()}

        {/* 左右控制按钮 */}
        {showControls && slides.length > 1 && (
          <>
            <button
              className="carousel-control carousel-control-prev"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="carousel-control carousel-control-next"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* 底部指示器 */}
        {showIndicators && slides.length > 1 && (
          <div className="carousel-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

