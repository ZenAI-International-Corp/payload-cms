'use client'

import React, { createContext, useContext } from 'react'
import type { Category } from '@/payload-types'

interface CategoriesContextType {
  mainCategories: Category[]
  allSubcategories: Category[]
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({
  children,
  mainCategories,
  allSubcategories,
}: {
  children: React.ReactNode
  mainCategories: Category[]
  allSubcategories: Category[]
}) {
  return (
    <CategoriesContext.Provider value={{ mainCategories, allSubcategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider')
  }
  return context
}

