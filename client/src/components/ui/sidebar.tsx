import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, Menu, PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const SidebarContext = React.createContext<{
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
} | null>(null)

const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ defaultOpen = true, open, onOpenChange, children, ...props }, ref) => {
  const [openState, setOpenState] = React.useState<boolean>(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  const openProp = open
  const setOpenProp = onOpenChange

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const newOpenState = typeof value === "function" ? value(openState) : value
      if (setOpenProp) {
        setOpenProp(newOpenState)
      } else {
        setOpenState(newOpenState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${newOpenState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, openState]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(!openMobile)
    } else {
      setOpen(!(openProp ?? openState))
    }
  }, [isMobile, openMobile, setOpenMobile, setOpen, openProp, openState])

  // Auto-close mobile sidebar when screen size changes
  React.useEffect(() => {
    if (!isMobile && openMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, openMobile, setOpenMobile])

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && openMobile) {
        const sidebar = document.querySelector('[data-state="expanded"]')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setOpenMobile(false)
        }
      }
    }

    if (isMobile && openMobile) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, openMobile, setOpenMobile])

  React.useEffect(() => {
    const handleResize = () => {
      // Mobile: < 768px, Tablet: 768px - 1024px, Desktop: > 1024px
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === SIDEBAR_KEYBOARD_SHORTCUT
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const value = React.useMemo(
    () => ({
      state: (openProp ?? openState) ? "expanded" as const : "collapsed" as const,
      open: openProp ?? openState,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [openProp, openState, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const sidebarVariants = cva(
  "group/sidebar relative flex h-full w-full flex-col gap-4 bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        sidebar: "border-r border-sidebar-border",
        floating: "rounded-lg border border-sidebar-border shadow-lg",
        inset: "rounded-lg border border-sidebar-border",
      },
      side: {
        left: "",
        right: "",
      },
      collapsible: {
        offcanvas: "",
        icon: "",
        none: "",
      },
    },
    defaultVariants: {
      variant: "sidebar",
      side: "left",
      collapsible: "none",
    },
  }
)

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof sidebarVariants> & {
      side?: "left" | "right"
      variant?: "sidebar" | "floating" | "inset"
      collapsible?: "offcanvas" | "icon" | "none"
    }
>(({ className, variant, side, collapsible, children, ...props }, ref) => {
  const { state, isMobile } = useSidebar()

  return (
    <aside
      ref={ref}
      data-state={state}
      data-collapsible={collapsible}
      className={cn(
        sidebarVariants({ variant, side, collapsible }),
        isMobile && "fixed inset-y-0 z-50",
        side === "left" && isMobile && "left-0",
        side === "right" && isMobile && "right-0",
        className
      )}
      style={{
        width: isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH,
      }}
      {...props}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-[60px] items-center px-2", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-2 overflow-hidden", className)}
    {...props}
  >
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
      {children}
    </div>
  </div>
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-[60px] items-center px-2", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-4 px-3 py-2", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between text-xs font-semibold text-sidebar-foreground/60",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-accent",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
SidebarGroupAction.displayName = "SidebarGroupAction"

const sidebarMenuVariants = cva(
  "group/menu flex flex-col gap-1",
  {
    variants: {
      variant: {
        default: "",
        secondary: "text-sidebar-foreground/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof sidebarMenuVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(sidebarMenuVariants({ variant }), className)}
    {...props}
  >
    {children}
  </div>
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "group/menu-button flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
  {
    variants: {
      variant: {
        default: "",
        ghost: "hover:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof sidebarMenuButtonVariants> & {
      asChild?: boolean
      isActive?: boolean
    }
>(({ className, variant, asChild = false, isActive, children, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  const compProps = asChild ? {} : { ref, type: "button" as const }

  return (
    <Comp {...compProps}>
      <button
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant }), className)}
        {...props}
      >
        {children}
      </button>
    </Comp>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-accent opacity-0 group-hover/menu-item:opacity-100 group-data-[active=true]/menu-item:opacity-100",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1 pl-6", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("group/menu-sub-item relative", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    isActive?: boolean
  }
>(({ className, asChild = false, isActive, children, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  const compProps = asChild ? {} : { ref, type: "button" as const }

  return (
    <Comp {...compProps}>
      <button
        ref={ref}
        data-active={isActive}
        className={cn(
          "group/menu-sub-button flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </Comp>
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 px-3 py-2", className)}
    {...props}
  >
    {showIcon && <Skeleton className="h-4 w-4" />}
    <Skeleton className="h-4 flex-1" />
  </div>
))
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("mx-3", className)}
    {...props}
  />
))
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { toggleSidebar, isMobile } = useSidebar()

  return (
    <button
      ref={ref}
      data-slot="sidebar-trigger"
      data-sidebar="trigger"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-8 h-8 w-8",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      {children ?? <PanelLeft className="h-4 w-4" />}
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute right-0 top-0 z-20 h-full w-1 bg-sidebar-border transition-colors hover:bg-sidebar-ring",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-4", className)}
    {...props}
  >
    {children}
  </div>
))
SidebarInset.displayName = "SidebarInset"

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  useSidebar,
}
