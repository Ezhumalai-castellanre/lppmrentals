# Sidebar Implementation

This document describes the sidebar implementation in the LPPM Rentals application.

## Overview

The sidebar is a collapsible navigation component that provides easy access to different sections of the application. It's built using the shadcn/ui sidebar component and integrates seamlessly with the existing authentication and routing system.

## Features

### Core Features
- **Collapsible**: Can be collapsed to icons only or completely hidden
- **Responsive**: Becomes a slide-out drawer on mobile devices
- **Keyboard Shortcuts**: Cmd+B (Mac) / Ctrl+B (Windows) to toggle
- **Persistent State**: Remembers open/closed state across page reloads
- **Tooltips**: Shows tooltips when collapsed
- **User Menu**: Integrated user dropdown with profile and account actions

### Navigation Items
- **Home**: Main rental application page
- **My Applications**: View submitted applications
- **Missing Documents**: Check for missing documents
- **Test API**: API testing interface
- **Test Sidebar**: Basic sidebar test page
- **Sidebar Demo**: Comprehensive demo page

## Implementation Details

### Components

#### `AppSidebar` (`client/src/components/app-sidebar.tsx`)
The main sidebar component that includes:
- Navigation menu with icons and labels
- User profile dropdown in the footer
- Integration with authentication system
- Route navigation using wouter

#### `SidebarProvider` (from `@/components/ui/sidebar`)
Provides context for sidebar state management:
- Handles open/closed state
- Manages mobile vs desktop behavior
- Provides keyboard shortcuts
- Persists state in cookies

#### `SidebarTrigger`
Button component to toggle the sidebar visibility.

### CSS Variables

The sidebar uses custom CSS variables defined in `client/src/index.css`:

```css
@layer base {
  :root {
    --sidebar-background: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.205 0 0);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);
  }

  .dark {
    --sidebar-background: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.439 0 0);
  }
}
```

### Tailwind Configuration

The sidebar colors are configured in `tailwind.config.ts`:

```typescript
sidebar: {
  DEFAULT: "var(--sidebar-background)",
  foreground: "var(--sidebar-foreground)",
  primary: "var(--sidebar-primary)",
  "primary-foreground": "var(--sidebar-primary-foreground)",
  accent: "var(--sidebar-accent)",
  "accent-foreground": "var(--sidebar-accent-foreground)",
  border: "var(--sidebar-border)",
  ring: "var(--sidebar-ring)",
},
```

## Usage

### Basic Usage

The sidebar is automatically integrated into the application layout when a user is authenticated:

```tsx
function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f2f8fe' }}>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Rental Applications</h1>
          </div>
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: '#f2f8fe' }}>
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
```

### Adding Navigation Items

To add new navigation items, update the `navigationItems` array in `AppSidebar`:

```tsx
const navigationItems = [
  {
    title: "New Page",
    url: "/new-page",
    icon: NewIcon,
  },
  // ... existing items
];
```

### Customizing the Sidebar

The sidebar can be customized by modifying the `AppSidebar` component:

- **Header**: Customize the header content and branding
- **Navigation**: Add, remove, or reorder navigation items
- **Footer**: Modify the user menu or add additional footer content
- **Styling**: Adjust colors, spacing, and layout

## Demo Pages

### `/test-sidebar`
A simple test page to verify the sidebar functionality.

### `/sidebar-demo`
A comprehensive demo page showcasing all sidebar features including:
- Feature descriptions
- Keyboard shortcuts
- Responsive behavior
- Navigation examples

## Keyboard Shortcuts

- **Cmd+B** (Mac) / **Ctrl+B** (Windows/Linux): Toggle sidebar
- **Escape**: Close mobile sidebar

## Mobile Behavior

On mobile devices (screen width < 768px):
- Sidebar becomes a slide-out drawer
- Trigger button opens/closes the drawer
- Drawer slides in from the left
- Backdrop overlay when open

## State Persistence

The sidebar state is persisted using cookies:
- Cookie name: `sidebar_state`
- Max age: 7 days
- Automatically restored on page reload

## Integration with Existing Components

The sidebar integrates with:
- **Authentication**: Only shows when user is authenticated
- **Routing**: Uses wouter for navigation
- **User Profile**: Displays user information and actions
- **Theme**: Supports light/dark mode
- **Responsive Design**: Adapts to different screen sizes

## Troubleshooting

### Common Issues

1. **Sidebar not showing**: Check if user is authenticated
2. **Navigation not working**: Verify route paths are correct
3. **Styling issues**: Ensure CSS variables are properly defined
4. **Mobile not working**: Check if `useIsMobile` hook is working

### Debug Steps

1. Check browser console for errors
2. Verify authentication state
3. Test on different screen sizes
4. Check cookie storage for sidebar state

## Future Enhancements

Potential improvements:
- **Nested Navigation**: Add collapsible sub-menus
- **Search**: Add search functionality to navigation
- **Customization**: Allow users to customize navigation
- **Themes**: Add more theme options
- **Animations**: Enhance transition animations 