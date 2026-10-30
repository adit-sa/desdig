'use client';

import React from 'react';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import ModernGovernmentTheme from './ModernGovernmentTheme';

interface ThemeRendererProps {
  tenant: ResolvedTenant;
  data: {
    articles: any[];
    announcements: any[];
    officials: any[];
    apbdes: any[];
    gallery?: any[];
    menus?: any[];
    pembangunan?: any[];
    themeConfig?: any;
  };
  allTenants: Array<{
    id: string;
    slug: string;
    namaDesa: string;
    activeThemeId: string;
    plan: { name: string } | null;
  }>;
}

export default function ThemeRenderer({ tenant, data }: ThemeRendererProps) {
  return (
    <ModernGovernmentTheme tenant={{ ...tenant, activeThemeId: 'modern-government' }} data={data} />
  );
}
