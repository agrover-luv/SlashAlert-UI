

import React, { useState, useEffect } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider 
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { User, Product } from "@/api/entities";
import authService from "@/services/authService";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  Plus, 
  User as UserIcon, 
  MessageSquare, 
  Package, 
  Bell, 
  Shield, 
  Settings, 
  LogOut, 
  Download, 
  X,
  Users,
  BarChart3
} from "lucide-react";
import Chatbot from "@/components/chatbot/Chatbot";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stats, setStats] = useState({ trackedProducts: 0, activeTracking: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const fetchUserAndStats = async () => {
      setIsCheckingAuth(true);
      setIsLoadingStats(true);
      try {
        // Initialize auth service and get current user
        await authService.initializeGoogle();
        const user = await User.me();
        setCurrentUser(user);
        
        if (user) {
          const allProducts = await Product.filter({ created_by: user.email });
          // Filter out soft-deleted products for stats
          const activeProducts = allProducts.filter(product => !product.deleted);
          const totalProducts = activeProducts.length;
          const activeTracking = activeProducts.filter(p => p.is_active === true).length;
          setStats({ trackedProducts: totalProducts, activeTracking: activeTracking });
        } else {
          setStats({ trackedProducts: 0, activeTracking: 0 });
          // If user is not logged in and not on Home page, redirect to Home.
          if (currentPageName !== 'Home') {
            window.location.href = createPageUrl('Home');
          }
        }

      } catch (error) {
        console.log("User not authenticated or error fetching data:", error.message);
        setCurrentUser(null);
        setStats({ trackedProducts: 0, activeTracking: 0 });
        // If user is not logged in and not on Home page, redirect to Home.
        if (currentPageName !== 'Home') {
            window.location.href = createPageUrl('Home');
        }
      }
      setIsCheckingAuth(false);
      setIsLoadingStats(false);
    };

    fetchUserAndStats();

    // Listen for authentication state changes
    const handleAuthStateChanged = (event) => {
      if (event.detail.isAuthenticated) {
        setCurrentUser(event.detail.user);
      } else {
        setCurrentUser(null);
        setStats({ trackedProducts: 0, activeTracking: 0 });
        if (currentPageName !== 'Home') {
          window.location.href = createPageUrl('Home');
        }
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);

    // Cleanup
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, [location.pathname, currentPageName]);

  // Add event listener for product updates from Dashboard
  useEffect(() => {
    const handleProductsUpdated = async () => {
      if (currentUser) {
        setIsLoadingStats(true);
        try {
          const allProducts = await Product.filter({ created_by: currentUser.email });
          // Filter out soft-deleted products for stats
          const activeProducts = allProducts.filter(product => !product.deleted);
          const totalProducts = activeProducts.length;
          const activeTracking = activeProducts.filter(p => p.is_active === true).length;
          setStats({ trackedProducts: totalProducts, activeTracking: activeTracking });
        } catch (error) {
          console.error("Error refreshing stats:", error);
        }
        setIsLoadingStats(false);
      }
    };

    // Listen for custom events from other components
    window.addEventListener('productsUpdated', handleProductsUpdated);

    // Cleanup event listener
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await User.logout();
      setCurrentUser(null);
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, try to redirect
      window.location.href = createPageUrl("Home");
    }
    setIsLoggingOut(false);
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      setInstallPrompt(null);
    }
  };

  const dismissInstallPrompt = () => {
    setInstallPrompt(null);
  };

  if (currentPageName === "Home") {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This check might be redundant due to redirect, but serves as a fallback.
  if (!currentUser) {
    // The useEffect should have already triggered a redirect. 
    // This state is for the brief moment before the redirect completes.
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { name: "Dashboard", href: createPageUrl("Dashboard"), icon: Home, current: currentPageName === "Dashboard" },
    { name: "Add Product", href: createPageUrl("AddProduct"), icon: Plus, current: currentPageName === "AddProduct" },
    { name: "Reviews", href: createPageUrl("Reviews"), icon: MessageSquare, current: currentPageName === "Reviews" },
    { name: "Account", href: createPageUrl("Account"), icon: UserIcon, current: currentPageName === "Account" }
  ];

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-blue: #4f46e5;
          --primary-purple: #7c3aed;
          --accent-pink: #ec4899;
          --success-green: #10b981;
          --warning-orange: #f59e0b;
          --danger-red: #ef4444;
          --neutral-gray: #6b7280;
        }
      `}</style>
      
      {installPrompt && (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install SlashAlert</h3>
                <p className="text-sm text-gray-600">Get quick access from your home screen</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInstallPrompt}
              className="p-1 h-auto hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleInstallApp}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-1"
            >
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={dismissInstallPrompt}
              className="flex-1"
            >
              Not now
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r-2 border-pink-200 bg-gradient-to-b from-white via-purple-50 to-pink-50 backdrop-blur-sm shadow-xl">
          <div className="p-6 border-b border-pink-200">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="SlashAlert Icon" 
                className="w-10 h-10 rounded-lg shadow-md"
              />
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SlashAlert
                </h1>
                <p className="text-xs text-gray-500">Price tracking made easy</p>
              </div>
            </div>
          </div>

          <SidebarContent className="p-4 flex flex-col justify-between">
            <div>
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-bold text-purple-600 uppercase tracking-wider px-3 py-2">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                          <Link 
                            to={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                              item.current
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold shadow-md border border-purple-200'
                                : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600'
                            }`}
                          >
                            <item.icon className={`w-5 h-5 ${item.current ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {currentUser && currentUser.role === 'admin' && (
                <SidebarGroup className="mt-8">
                  <SidebarGroupLabel className="text-xs font-bold text-orange-600 uppercase tracking-wider px-3 py-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    Admin Panel
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link 
                            to={createPageUrl("AdminDashboard")}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                              currentPageName === "AdminDashboard"
                                ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 font-semibold shadow-md border border-orange-200'
                                : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600'
                            }`}
                          >
                            <BarChart3 className={`w-5 h-5 ${currentPageName === "AdminDashboard" ? 'text-orange-600' : 'text-gray-400'}`} />
                            <span className="font-medium">Admin Dashboard</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              <SidebarGroup className="mt-8">
                <SidebarGroupLabel className="text-xs font-bold text-purple-600 uppercase tracking-wider px-3 py-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Quick Stats
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2 space-y-4">
                    <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-100 to-cyan-100 p-3 rounded-xl shadow-sm">
                      <Package className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 font-medium">Tracked Products</span>
                      {isLoadingStats ? (
                        <div className="ml-auto w-5 h-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      ) : (
                        <span className="ml-auto font-bold text-blue-600 text-lg">{stats.trackedProducts}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-xl shadow-sm">
                      <Bell className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700 font-medium">Active Tracking</span>
                      {isLoadingStats ? (
                        <div className="ml-auto w-5 h-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                      ) : (
                        <span className="ml-auto font-bold text-green-600 text-lg">{stats.activeTracking}</span>
                      )}
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>

            <div className="mt-auto pt-6 border-t border-pink-200">
              <div className="px-3 py-2 space-y-3">
                {currentUser && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-200">
                    <UserIcon className="w-6 h-6 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-0.5 ${
                            currentUser.role === 'admin' 
                              ? 'bg-orange-100 text-orange-700 border-orange-200' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {currentUser.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        {currentUser.subscription_status === 'premium' && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-200">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-600 text-gray-600 p-3 rounded-xl"
                >
                  {isLoggingOut ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                </Button>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-pink-200">
            <div className="text-center text-xs text-gray-500">
              <p className="font-medium text-purple-600">SlashAlert</p>
              <p>© 2024 • Track smarter, save more</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <div className="flex-grow p-4 md:p-8">
            {children}
          </div>
        </main>
        
        <Chatbot />
      </div>
    </SidebarProvider>
  );
}

