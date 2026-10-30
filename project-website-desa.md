# PROJECT: MULTI-TENANT WEBSITE DESA SAAS BUILDER

## 1. ROLE

Act as a senior full-stack engineer, SaaS architect, UI/UX designer, and PostgreSQL database architect.

Build a production-oriented SaaS platform for creating, managing, customizing, and selling websites for Indonesian villages (Website Desa).

This is not a single village website. It must support multiple villages from one centralized application, with independently managed content, themes, modules, users, domains, and subscription plans.

The application must be modular, maintainable, secure, mobile-first, and designed for future commercial growth.

## 2. REQUIRED TECHNOLOGY STACK

- Node.js LTS
- Next.js App Router
- TypeScript with strict mode
- React
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- Zod for validation
- React Hook Form for complex forms
- Auth.js or Better Auth for authentication; select one and configure it consistently
- Cloudflare R2-compatible object storage for uploaded media
- Vercel-compatible deployment
- Vitest for unit tests
- Playwright for critical end-to-end tests

Use stable, mutually compatible package versions. Do not introduce unnecessary dependencies.

## 3. MULTI-TENANT ARCHITECTURE

Build a multi-tenant architecture in which each village is a separate tenant.

Each tenant must have:

- Unique tenant ID and slug
- Village name and official identity
- Village logo and optional official emblem
- Address, province, regency, district, and postal code
- Contact details and social media
- Active theme and theme settings
- Enabled modules and subscription plan
- Custom domain and platform subdomain
- Independent users, roles, and content
- SEO metadata and analytics settings

Support:
- desa-a.platform-domain.id
- desa-b.platform-domain.id
- Custom domains such as www.desaku.id

Resolve the tenant from the hostname using a centralized tenant-resolution service and verified domain mappings.

Never trust a tenant ID supplied by a browser without verifying authorization.

All tenant-owned database queries and mutations must be scoped to the authenticated tenant. Enforce this through reusable server-side services, authorization checks, and appropriate database constraints.

Evaluate PostgreSQL Row-Level Security as an additional defense-in-depth measure.

Tenant A must never be able to read or modify Tenant B's data.

## 4. WEBSITE BUILDER AND THEME ENGINE

Create a theme system that allows the platform administrator to add and sell multiple website themes.

Requirements:

- Each theme has a unique identifier, name, version, preview image, description, and supported modules.
- Themes can be activated, previewed, and switched by authorized tenant administrators.
- Theme settings include colors, typography, layout width, header style, footer style, logo, and navigation.
- Create at least three distinct initial themes:
  1. Modern Government
  2. Traditional Village
  3. Modern Editorial
- All themes must be responsive and accessible.
- Theme switching must preserve existing content.
- Themes must use shared data contracts and reusable components.
- Provide a theme preview before publishing.
- Support draft and published theme configurations.
- Keep theme presentation separate from business logic and database queries.

Build a configurable page-section system. Allow administrators to enable, disable, reorder, and configure supported sections such as hero banners, village profile, news, statistics, galleries, services, maps, and contact information.

Do not execute arbitrary JavaScript or user-provided code inside themes. Use trusted, registered theme components and validated JSON configurations.

## 5. MODULAR PLUGIN SYSTEM

Create a registry-based module architecture.

Each module must define:

- Unique module key
- Display name and description
- Module version
- Dependencies, if any
- Required permissions
- Navigation entries
- Supported themes
- Configuration schema
- Installation and activation status

Provide these initial modules:

1. Village Profile
2. News and Articles
3. Announcements
4. Events and Calendar
5. Photo Gallery
6. Public Documents
7. Village Potential and Tourism
8. Local UMKM Directory
9. Public Budget and Realization Transparency
10. Public Complaints
11. Public Services
12. Village Statistics and Map
13. PPID and Public Information
14. SEO and Sitemap
15. Website Analytics

Module lifecycle:
- Available
- Enabled
- Disabled
- Restricted by subscription plan

When a module is disabled, hide its navigation and UI, block its APIs, and enforce permissions on the server.

Disabling a module must not delete its data.

Define dependency rules and migration procedures for modules that require additional database tables.

Do not allow arbitrary third-party code execution. Initially, support only platform-managed modules registered in the application.

## 6. USER ROLES AND PERMISSIONS

Implement role-based access control.

Platform roles:
- Super Admin
- Platform Operator

Tenant roles:
- Village Administrator
- Editor
- Content Author
- Read-only Auditor

Permissions must be configurable by resource and action.

Examples:
- Manage tenant settings
- Manage users
- Create and edit articles
- Publish articles
- Manage themes
- Enable modules
- Manage domains
- View subscription information
- View audit logs

Enforce authorization on the server for every protected operation. Hiding buttons in the UI is not sufficient.

Implement secure login, logout, session management, password reset, and account invitation flows.

Add audit logs for important administrative actions.

## 7. CONTENT MANAGEMENT SYSTEM

Implement a CMS for:

- Pages
- News and articles
- Categories and tags
- Announcements
- Events
- Photo galleries
- Documents
- Village officials
- Village profile
- Village potential
- Public contact information

Each content item should support tenant ownership, slug, status, author, timestamps, and SEO fields where applicable.

Include:
- Draft, review, published, and archived states where appropriate
- Rich text editing with sanitized HTML
- Image upload and optimization
- Search, filters, pagination, and sorting
- Preview before publishing
- Scheduled publishing if supported by the deployment architecture
- Revision history for important content
- Slug uniqueness within the appropriate tenant and content type

Never expose unpublished content through public APIs.

## 8. SUPER ADMIN DASHBOARD

Create a separate platform administration area.

Features:
- Dashboard overview
- Tenant registration and management
- Suspend and reactivate tenants
- Theme catalog management
- Module catalog management
- Subscription plans
- Tenant subscription status
- Domain verification status
- Storage usage
- User and audit-log management
- Platform settings

Provide useful empty states, loading states, error handling, and confirmation dialogs.

## 9. TENANT ADMIN DASHBOARD

Build a modern, professional dashboard using shadcn/ui.

Include:
- Overview
- Website appearance
- Theme selector and preview
- Page and section builder
- Content management
- Module management
- Navigation management
- Media library
- User and role management
- Domain settings
- SEO settings
- Subscription and usage
- Audit logs

The dashboard must work on mobile, tablet, and desktop.

Use a consistent design system, accessible forms, reusable tables, clear validation messages, and toast notifications.

## 10. SUBSCRIPTION AND MONETIZATION

Prepare a subscription architecture with configurable plans.

Example plans:

Basic:
- One village website
- Basic themes
- Limited modules
- Platform subdomain

Professional:
- More themes
- Additional modules
- Custom domain
- Expanded media storage

Enterprise:
- Advanced customization
- Extended permissions
- Priority support
- Additional configurable limits

Do not hardcode prices or limits in UI components. Store plan definitions and entitlements centrally.

Implement:
- Trial period configuration
- Subscription lifecycle
- Renewal and expiry states
- Feature entitlements
- Usage limits
- Grace period
- Suspension and reactivation rules

Design a payment-provider abstraction so a payment gateway such as Midtrans or Xendit can be integrated later.

Do not mark payments as successful based only on a client request. Verify provider webhooks and payment status server-side.

If payment integration is not configured, use an explicit manual subscription-management mode rather than a fake payment flow.

## 11. DATABASE DESIGN

Design a normalized PostgreSQL schema using Prisma.

Consider models for:

- User
- Account and Session, as required by the selected authentication library
- Tenant
- TenantMembership
- Role and Permission
- Theme
- TenantThemeConfiguration
- Module
- TenantModule
- Page
- PageSection
- Article
- Category
- Tag
- Announcement
- Event
- MediaAsset
- PublicDocument
- VillageOfficial
- Domain
- SubscriptionPlan
- Subscription
- Payment
- AuditLog
- SiteSetting

Add appropriate relations, indexes, uniqueness constraints, timestamps, and deletion policies.

All tenant-owned records must have explicit tenant relationships.

Use database migrations. Never reset or drop a production database as a routine development step.

Avoid storing binary images directly in PostgreSQL. Store media in object storage and keep metadata and object keys in the database.

Use JSON fields only where flexible configuration is genuinely appropriate. Validate their structure with Zod.

## 12. SEO AND PUBLIC WEBSITE

Each village website must support:

- Server-rendered public pages
- Unique page titles and meta descriptions
- Canonical URLs
- Open Graph metadata
- Sitemap.xml
- robots.txt
- Structured data where appropriate
- Search-engine-friendly slugs
- Responsive images
- Accessible navigation
- Fast page loads
- Custom favicon
- Social media links

Generate metadata based on the current tenant and page.

Ensure one tenant's metadata, sitemap, canonical URLs, or content cannot leak into another tenant's website.

Do not index admin dashboards, draft content, or private documents.

## 13. SECURITY AND RELIABILITY

Implement:

- Server-side authentication and authorization
- Tenant isolation
- Zod validation
- Secure file upload validation
- Sanitization against XSS
- CSRF protection where applicable
- Rate limiting for login and public submission endpoints
- Secure session cookies
- Environment variable management
- Audit logging
- Safe error handling
- Database backup and restore documentation
- Logging and monitoring hooks
- Protection against mass assignment
- Pagination limits
- Upload size limits

Public complaint submissions must not expose personal information. Private documents must not be accessible through public object URLs.

Do not store secrets in source code or expose them in client-side bundles.

## 14. DEVELOPMENT AND DEPLOYMENT

Create:
- A complete project structure
- package.json scripts
- .env.example without real credentials
- Prisma schema
- Initial migrations
- Seed script with demo tenants and users
- Reusable UI components
- Tenant-resolution middleware or server-side routing solution
- API endpoints or server actions with proper authorization
- Unit tests
- Tenant-isolation tests
- Critical end-to-end tests
- README with setup instructions
- Deployment instructions for the selected hosting provider

Use maintainable folder boundaries for app routes, modules, components, server services, validation schemas, and database access.

Do not put all business logic in route handlers or React components.

## 15. IMPLEMENTATION STRATEGY

Work in phases. Do not attempt to generate the entire application in one unverified code dump.

Phase 1:
- Inspect the repository and existing files.
- Establish architecture and folder structure.
- Set up Next.js, TypeScript, Tailwind, shadcn/ui, Prisma, and PostgreSQL.
- Implement authentication and tenant isolation.
- Create database schema and migrations.
- Seed two demo tenants.
- Implement tenant-aware public websites.

Phase 2:
- Build the CMS and tenant dashboard.
- Add theme registry, three initial themes, and theme switching.
- Implement page sections and navigation management.

Phase 3:
- Implement module registry, module activation, permission enforcement, and module configuration.
- Add initial content modules.

Phase 4:
- Build super admin tools, subscription plans, entitlements, domains, and usage limits.

Phase 5:
- Add media storage, SEO, audit logs, security hardening, automated tests, and deployment documentation.

After each phase:
1. Explain what was implemented.
2. List files created or changed.
3. Run lint, type checking, tests, and production build where applicable.
4. Fix errors before continuing.
5. Identify incomplete work honestly.
6. Preserve existing working functionality.

Do not overwrite working code without inspecting it first. Do not use mock data as a substitute for required production functionality.

## 16. DEFINITION OF DONE

The initial MVP is complete when:

- Two demo villages can use the same application independently.
- Each village has its own content and settings.
- Each village can select a different theme.
- Theme switching does not destroy content.
- Authorized administrators can enable and disable supported modules.
- Disabled modules cannot be accessed through protected APIs.
- Tenant data isolation is verified by automated tests.
- Administrators can create and publish news.
- Public pages render correctly on mobile and desktop.
- The application can be configured for production deployment.
- Database migrations, environment variables, and setup instructions are documented.

Begin by inspecting the current repository and reporting the proposed architecture, database relationships, and Phase 1 implementation plan. Then implement Phase 1 incrementally. Do not stop at a visual mockup.

## 17. UI/UX DESIGN & BORDER RADIUS STANDARDS (CRITICAL USER RULE)
- **Aturan Sudut / Pinggiran (Border Radius)**: Sudut **JANGAN TERLALU ROUND / BULAT**.
- Hindari penggunaan `rounded-3xl` atau pill/bubble besar yang membuat interface terkesan kekanak-kanakan atau bulky.
- **Standar**:
  - Cards, Containers, Dialogs, Modals, Banners: gunakan **`rounded-xl`** (12px) atau `rounded-lg` (8px).
  - Buttons, Inputs, Filters, Tabs: gunakan **`rounded-lg`** (8px) atau `rounded-md` (6px).
  - Modul Struktur Aparatur: Default 1 baris horizontal slider (`w-[260px] sm:w-[280px]` per kartu, snap-scroll dengan tombol panah slide `<` & `>`) serta tombol toggle collapse/expand (1 Baris / Buka Grid). Foto dibuat berukuran besar, tajam, dan proporsional (`h-60 sm:h-64`).

