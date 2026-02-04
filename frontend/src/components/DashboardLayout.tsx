"use client";

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Key,
  Webhook,
  BarChart3,
  Settings,
  FileCode,
  Zap,
  Menu,
  X,
  Building2,
  Calendar,
  Home,
  DollarSign,
  FileText,
  HelpCircle,
  Users,
  BookOpen,
  Sparkles,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu1"

interface NavItem {
  href: string;
  title: string;
  icon: ReactNode;
  description?: string;
}

const productsItems: NavItem[] = [
  { 
    href: '/services', 
    title: 'Services', 
    icon: <Zap className="w-4 h-4" />,
    description: 'Manage your API services'
  },
  { 
    href: '/marketplace', 
    title: 'Marketplace', 
    icon: <Building2 className="w-4 h-4" />,
    description: 'Discover and integrate services'
  },
  { 
    href: '/subscriptions', 
    title: 'Subscriptions', 
    icon: <Calendar className="w-4 h-4" />,
    description: 'Manage your subscriptions'
  },
  { 
    href: '/api-keys', 
    title: 'API Keys', 
    icon: <Key className="w-4 h-4" />,
    description: 'Manage API keys and access'
  },
  { 
    href: '/webhooks', 
    title: 'Webhooks', 
    icon: <Webhook className="w-4 h-4" />,
    description: 'Configure webhook endpoints'
  },
  { 
    href: '/analytics', 
    title: 'Analytics', 
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'View usage analytics'
  },
];

const resourcesItems: NavItem[] = [
  { 
    href: '/logs', 
    title: 'Logs', 
    icon: <FileCode className="w-4 h-4" />,
    description: 'View API request logs'
  },
  { 
    href: '/settings', 
    title: 'Settings', 
    icon: <Settings className="w-4 h-4" />,
    description: 'Configure account settings'
  },
  { 
    href: '/docs', 
    title: 'Documentation', 
    icon: <BookOpen className="w-4 h-4" />,
    description: 'API documentation'
  },
  { 
    href: '/support', 
    title: 'Support', 
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Get help and support'
  },
];

const companyItems: NavItem[] = [
  { 
    href: '/about', 
    title: 'About Us', 
    icon: <Users className="w-4 h-4" />,
    description: 'Learn about our company'
  },
  { 
    href: '/blog', 
    title: 'Blog', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Read our latest updates'
  },
  { 
    href: '/status', 
    title: 'Status', 
    icon: <Globe className="w-4 h-4" />,
    description: 'Service status and uptime'
  },
];

function ListItem({
  title,
  description,
  icon,
  className,
  href,
  ...props
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  className?: string;
  href: string;
}) {
  const pathname = usePathname();
  
  return (
    <NavigationMenuLink 
      className={cn(
        "flex w-full flex-row gap-x-3 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-lg p-3 transition-all duration-200",
        pathname === href && "bg-white/10",
        className
      )} 
      {...props} 
      asChild
    >
      <Link href={href}>
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-white/5 border border-white/10">
          {icon}
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium text-sm text-white">{title}</span>
          {description && (
            <span className="text-xs text-white/60 mt-0.5">{description}</span>
          )}
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

// Fixed cn function - only accepts string arguments
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'products' | 'resources' | 'company' | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 bg-[#0a0a0a]/95 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - Desktop (left) */}
            <Link href="/dashboard" className=" lg:flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-black  to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-110">
                
              </div>
              <span className="hidden sm:inline font-bold font-sans text-base sm:text-lg text-cyan-200 group-hover:text-cyan-400 transition-colors duration-300">
                OneRouter
              </span>
            </Link>

            {/* Mobile Logo (centered) */}
            <div className="lg:hidden flex-1 flex justify-center">
              <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                
                <span className="font-bold font-sans text-lg text-cyan-200 group-hover:text-cyan-400 transition-colors duration-300">
                  OneRouter
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Navigation Menu - Desktop */}
            <NavigationMenu className="hidden lg:flex flex-1 justify-start ml-4 sm:ml-8 font-sans" suppressHydrationWarning>
              <NavigationMenuList>
                {/* Home Link */}
                <NavigationMenuItem>
                  <Link href="/" className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2",
                    pathname === '/' && 'bg-white/10'
                  )}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </NavigationMenuItem>

                {/* Dashboard Link */}
                <NavigationMenuItem>
                  <Link href="/dashboard" className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2",
                    pathname === '/dashboard' && 'bg-white/10'
                  )}>
                    Dashboard
                  </Link>
                </NavigationMenuItem>

                {/* Products Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2"
                  )}>
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0a0a0a] p-4 border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="grid grid-cols-2 gap-2 w-[600px]">
                      <div className="space-y-2">
                        {productsItems.slice(0, 3).map((item) => (
                          <ListItem key={item.href} {...item} />
                        ))}
                      </div>
                      <div className="space-y-2">
                        {productsItems.slice(3).map((item) => (
                          <ListItem key={item.href} {...item} />
                        ))}
                      </div>
                      <div className="col-span-2 p-3 mt-2 border-t border-white/10">
                        <p className="text-sm text-white/60">
                          Need help?{' '}
                          <Link href="/contact" className="text-cyan-400 font-medium hover:underline">
                            Contact sales
                          </Link>
                        </p>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Resources Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2"
                  )}>
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0a0a0a] p-4 border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="grid gap-2 w-[400px]">
                      <div className="space-y-2">
                        {resourcesItems.map((item) => (
                          <ListItem key={item.href} {...item} />
                        ))}
                      </div>
                      <div className="p-3 mt-2 border-t border-white/10">
                        <p className="text-sm text-white/60">
                          Check our{' '}
                          <Link href="/status" className="text-cyan-400 font-medium hover:underline">
                            system status
                          </Link>
                        </p>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Company Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2"
                  )}>
                    Company
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0a0a0a] p-4 border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="space-y-2 w-[280px]">
                      {companyItems.map((item) => (
                        <ListItem key={item.href} {...item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Pricing */}
                <NavigationMenuItem>
                  <Link href="/credits" className={cn(
                    navigationMenuTriggerStyle(),
                    "px-3 py-2",
                    pathname === '/credits' && 'bg-white/10'
                  )}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Credits
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4 ml-auto flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-300 group">
                <UserButton afterSignOutUrl="/" />
                <div className="hidden sm:block">
                  <p className="text-m font-medium text-white group-hover:text-cyan-400 transition-colors duration-300">
                    Account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-6 border-t border-white/10 mt-2">
              <div className="space-y-1 py-4">
                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                >
                  Dashboard
                </Link>
                
                {/* Products Dropdown - Mobile with arrow */}
                <div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                  >
                    <span>Products</span>
                    {openDropdown === 'products' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openDropdown === 'products' && (
                    <div className="grid grid-cols-2 gap-2 px-4 py-2">
                      {productsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setOpenDropdown(null);
                          }}
                          className="flex flex-col p-3 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-cyan-500">{item.icon}</span>
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-white/60">{item.description}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resources Dropdown - Mobile with arrow */}
                <div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                  >
                    <span>Resources</span>
                    {openDropdown === 'resources' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openDropdown === 'resources' && (
                    <div className="space-y-1 px-4 py-2">
                      {resourcesItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <span className="text-gray-300">{item.icon}</span>
                          <div>
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.description && (
                              <p className="text-xs text-white/60">{item.description}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Dropdown - Mobile with arrow */}
                <div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                  >
                    <span>Company</span>
                    {openDropdown === 'company' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openDropdown === 'company' && (
                    <div className="space-y-1 px-4 py-2">
                      {companyItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <span className="text-gray-300">{item.icon}</span>
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
                <Link 
                  href="/credits" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-base font-medium"
                >
                  <DollarSign className="w-4 h-4" />
                  Credits
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}