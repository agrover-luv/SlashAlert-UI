
import React, { useState, useEffect, useCallback } from "react";
import { Product } from "@/api/entities";
import { Retailer } from "@/api/entities";
import { Alert } from "@/api/entities";
import { User } from "@/api/entities"; 
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Package, TrendingDown, DollarSign, Bell, Sparkles, Star, Zap, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import ProductCard from "../components/dashboard/ProductCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import DeleteConfirmationDialog from "../components/dashboard/DeleteConfirmationDialog";
import EditProductModal from "../components/dashboard/EditProductModal";
import DisclaimerModal from "../components/dashboard/DisclaimerModal";
import { checkAndUpdateProductPrice } from "../components/products/PriceCheckService";
import { toast } from "sonner";

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Define the product limit for free users
const FREE_PLAN_PRODUCT_LIMIT = 5;

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false); // New state for refresh all
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [userPlan, setUserPlan] = useState(null); // New state for user plan
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  
  // selectedProduct is for viewing details, not implemented yet.
  const [selectedProduct, setSelectedProduct] = useState(null);

  const checkStaleProductPrices = useCallback(async (productsToCheck) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayDateString = today.toISOString().split('T')[0];
    const yesterdayDateString = yesterday.toISOString().split('T')[0];
    
    // Only check products that haven't been updated since yesterday
    // This indicates the daily job may have failed
    const staleProducts = productsToCheck.filter(product => {
      if (!product.is_active) return false; // Skip inactive products
      
      if (!product.last_checked) return true; // Never checked before
      
      const lastCheckedDate = new Date(product.last_checked);
      const lastCheckedDateString = lastCheckedDate.toISOString().split('T')[0];
      
      // Only consider it stale if it wasn't checked today OR yesterday
      // This prevents running on every login if the daily job is working
      return lastCheckedDateString < yesterdayDateString;
    });

    // Only run if there are products that appear to have been missed by the daily job
    if (staleProducts.length > 0) {
      console.log(`Found ${staleProducts.length} products that appear to have been missed by the daily job. Running backup check...`);
      
      toast.info(`Daily job may have failed. Checking ${staleProducts.length} products...`, {
        description: "Running backup price checks for products missed by scheduled job.",
      });

      let updateCount = 0;
      
      // Update stale products in batches to avoid overwhelming the system
      const batchSize = 3;
      for (let i = 0; i < staleProducts.length; i += batchSize) {
        const batch = staleProducts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (product) => {
          try {
            const result = await checkAndUpdateProductPrice(product);
            if (result.success) {
              updateCount++;
            }
          } catch (error) {
            console.error(`Failed to backup-check price for ${product.name}:`, error);
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to be respectful to external services
        if (i + batchSize < staleProducts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (updateCount > 0) {
        toast.success(`Backup check updated ${updateCount} product prices!`, {
          description: "Your price data is now current.",
        });
        
        // Refresh data to show updated prices
        setTimeout(async () => {
          try {
            const updatedProducts = await Product.filter({}, "-updated_date");
            const activeUpdatedProducts = updatedProducts.filter(product => !product.deleted);
            setProducts(activeUpdatedProducts);
          } catch (error) {
            console.error("Error refreshing updated products:", error);
          }
        }, 2000);
      }
    } else {
      console.log("All active products appear to have been checked recently. Skipping backup check.");
    }
  }, [setProducts]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me(); // Fetch current user for plan info
      setUserPlan(currentUser.plan); // Set user plan state

      const [userProducts, retailerData, userAlerts] = await Promise.all([
        // API will filter by user via bearer token automatically
        Product.filter({}, "-updated_date"),
        Retailer.list(),
        // API will filter by user via bearer token automatically  
        Alert.filter({}, "-created_date", 50)
      ]);
      
      // Filter out soft-deleted products for regular users
      const activeProducts = userProducts.filter(product => !product.deleted);
      
      // Filter alerts to only show last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAlerts = userAlerts.filter(alert => {
        const alertDate = new Date(alert.created_date);
        return alertDate >= thirtyDaysAgo;
      }).slice(0, 10);
      
      setProducts(activeProducts);
      setRetailers(retailerData);
      setAlerts(recentAlerts);

      // Only run backup price checks if daily job appears to have failed
      await checkStaleProductPrices(activeProducts);
      
    } catch (error) {
      console.error("Error loading initial data:", error);
      // If user is not logged in or another error occurs, show an empty state
      setProducts([]);
      setRetailers([]);
      setAlerts([]);
      setUserPlan(null); // Reset user plan on error
    }
    setIsLoading(false);
  }, [setProducts, setRetailers, setAlerts, setIsLoading, setUserPlan, checkStaleProductPrices]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const handleRefreshAllPrices = async () => {
    setIsRefreshingAll(true);
    toast.info("Starting price refresh for all active products...", {
      description: "This may take a few moments. We'll notify you when it's complete.",
    });

    // Make sure we're operating on the latest product list
    const currentProducts = await Product.filter({}, "-updated_date");
    const activeProducts = currentProducts.filter(p => p.is_active && !p.deleted);
    
    let successCount = 0;
    let errorCount = 0;

    // Run checks in parallel for better performance
    const refreshPromises = activeProducts.map(async (product) => {
      try {
        const result = await checkAndUpdateProductPrice(product);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
        console.error(`Failed to refresh price for ${product.name}:`, e);
      }
    });

    await Promise.all(refreshPromises);

    await loadInitialData(); // Reload all data to reflect changes
    setIsRefreshingAll(false);

    if (errorCount > 0) {
      toast.warning(`Price refresh complete with ${errorCount} error(s).`, {
        description: `${successCount} product(s) updated successfully.`,
      });
    } else if (successCount > 0) {
      toast.success("All active product prices have been refreshed!", {
        description: `${successCount} product(s) updated successfully.`,
      });
    } else {
      toast.info("No active products to refresh or no changes found.");
    }
  };

  const handleEdit = (product) => {
    setProductToEdit(product);
  };
  
  const handleDelete = (product) => {
    setProductToDelete(product);
  };

  // This function is now responsible for refreshing product data from the backend.
  // It is conceptually similar to `loadInitialData` but used in specific contexts.
  const handlePriceUpdate = async () => {
    try {
      // Reload all products to ensure `deleted` status is respected
      await loadInitialData();
      
      // Dispatch a custom event to notify other components (like Layout) that products have changed
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      // Perform soft delete instead of hard delete
      await Product.update(productToDelete.id, {
        deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false // Also disable tracking when soft deleting
      });
      
      // Remove from local state to update UI immediately
      setProducts(products.filter(p => p.id !== productToDelete.id));
      
      // Dispatch event to notify Layout that products have changed
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
    setProductToDelete(null);
  };

  const handleSaveEdit = async (updatedProduct) => {
    try {
      const { id, ...dataToUpdate } = updatedProduct;
      await Product.update(id, dataToUpdate);
      
      // Refresh all products from database to ensure we get the latest data
      await loadInitialData();
      
      // Dispatch event to notify Layout that products have changed
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    } catch (error) {
      console.error("Failed to update product:", error);
    }
    setProductToEdit(null);
  };

  // New function to calculate days left and sort products
  const getSortedProducts = () => {
    if (!retailers || retailers.length === 0) return products;

    return [...products].sort((a, b) => {
      // Calculate days left for product A
      const retailerA = retailers.find(r => r.name.toLowerCase() === a.retailer.toLowerCase());
      let daysLeftA = -1; // Default for expired/no guarantee
      
      if (retailerA && a.purchased_date && retailerA.price_guarantee_days > 0) {
        const purchaseDateA = new Date(a.purchased_date);
        const expirationDateA = new Date(purchaseDateA);
        expirationDateA.setDate(expirationDateA.getDate() + retailerA.price_guarantee_days);
        const today = new Date();
        daysLeftA = Math.ceil((expirationDateA - today) / (1000 * 60 * 60 * 24));
        daysLeftA = Math.max(daysLeftA, -1); // Ensure expired items get -1
      }

      // Calculate days left for product B
      const retailerB = retailers.find(r => r.name.toLowerCase() === b.retailer.toLowerCase());
      let daysLeftB = -1; // Default for expired/no guarantee
      
      if (retailerB && b.purchased_date && retailerB.price_guarantee_days > 0) {
        const purchaseDateB = new Date(b.purchased_date);
        const expirationDateB = new Date(purchaseDateB);
        expirationDateB.setDate(expirationDateB.getDate() + retailerB.price_guarantee_days);
        const today = new Date();
        daysLeftB = Math.ceil((expirationDateB - today) / (1000 * 60 * 60 * 24));
        daysLeftB = Math.max(daysLeftB, -1); // Ensure expired items get -1
      }

      // Sort: Most days left first, expired items (-1) go to the end
      if (daysLeftA === -1 && daysLeftB === -1) {
        // Both expired or no guarantee, sort by updated date
        return new Date(b.updated_date) - new Date(a.updated_date);
      }
      if (daysLeftA === -1) return 1; // A is expired, B goes first
      if (daysLeftB === -1) return -1; // B is expired, A goes first
      
      return daysLeftB - daysLeftA; // Most days left first
    });
  };

  const getStats = () => {
    const totalProducts = products.length; // Products state contains only non-deleted products
    const activeProducts = products.filter(p => p.is_active).length;

    const lifetimeSavings = products.reduce((sum, product) => {
      const saving = product.original_price - product.current_price;

      if (saving <= 0) {
        return sum; // No savings if price hasn't dropped
      }

      // Include all savings regardless of tracking status
      // - For active tracking: this is "potential saving"
      // - For disabled tracking: this is "saved amount"
      return sum + saving;
    }, 0);

    return {
      totalProducts,
      activeProducts,
      lifetimeSavings
    };
  };

  const stats = getStats();
  const sortedProducts = getSortedProducts();

  // Determine if the user has reached the product limit for free plan
  const isFreeUser = userPlan === 'free';
  const hasReachedFreeProductLimit = isFreeUser && stats.totalProducts >= FREE_PLAN_PRODUCT_LIMIT;

  // Create recent activity from alerts with product information
  const recentActivity = alerts.map(alert => {
    const product = products.find(p => p.id === alert.product_id);
    return {
      ...alert,
      product_name: product ? product.name : 'Unknown Product',
      product_retailer: product ? product.retailer : 'Unknown Retailer'
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 mb-6 md:mb-8 md:flex-row md:justify-between md:items-center"
        >
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
              SlashAlert Board
              <Star className="w-6 h-6 md:w-10 md:h-10 text-yellow-400" />
            </h1>
            <p className="text-gray-600 text-sm md:text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
              Monitor your tracked products and price changes
              <Zap className="w-4 h-4 md:w-5 h-5 text-yellow-500" />
            </p>
          </div>
          {/* Conditional rendering for "Track New Product" button based on limit */}
          {hasReachedFreeProductLimit ? (
            <Button
              className="w-full md:w-auto bg-gray-300 text-gray-700 cursor-not-allowed shadow-none rounded-2xl px-4 py-3 md:px-6 text-sm md:text-lg font-bold"
              disabled
              title={`Upgrade to track more than ${FREE_PLAN_PRODUCT_LIMIT} products!`}
            >
              <Plus className="w-4 h-4 md:w-6 h-6 mr-2" />
              Limit Reached (Upgrade)
            </Button>
          ) : (
            <Link to={createPageUrl("AddProduct")}>
              <Button className="w-full md:w-auto bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 rounded-2xl px-4 py-3 md:px-6 text-sm md:text-lg font-bold">
                <Plus className="w-4 h-4 md:w-6 h-6 mr-2" />
                Track New Product ✨
              </Button>
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatsCard
            title="Total Products 📦"
            value={stats.totalProducts.toLocaleString('en-US')}
            icon={Package}
            color="bg-gradient-to-br from-blue-400 to-purple-600"
            description="Items being tracked"
          />
          <StatsCard
            title="Active Tracking 🎯"
            value={stats.activeProducts.toLocaleString('en-US')}
            icon={TrendingDown}
            color="bg-gradient-to-br from-green-400 to-blue-500"
            description="Currently monitoring"
          />
          <StatsCard
            title="Lifetime Savings 💰"
            value={`$${formatNumberWithCommas(stats.lifetimeSavings)}`}
            icon={DollarSign}
            color="bg-gradient-to-br from-pink-400 to-red-500"
            description="Including potential savings"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-3 md:gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900">Tracked Products</h2>
              <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAllPrices}
                    disabled={isRefreshingAll}
                    className="bg-white/80 hover:bg-white text-primary-blue"
                >
                    {isRefreshingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isRefreshingAll ? "Refreshing..." : "Refresh All Active Prices"}
                </Button>
                <p className="text-neutral-500 text-sm md:text-base">{sortedProducts.length} items</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid gap-3 md:gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl"
              >
                <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No products tracked yet
                </h3>
                <p className="text-neutral-500 mb-6">
                  Start tracking your favorite products to monitor price changes
                </p>
                {/* Replicate the button logic from above for the empty state */}
                {hasReachedFreeProductLimit ? (
                    <Button
                      className="bg-gray-300 text-gray-700 cursor-not-allowed"
                      disabled
                      title={`Upgrade to track more than ${FREE_PLAN_PRODUCT_LIMIT} products!`}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Limit Reached (Upgrade)
                    </Button>
                ) : (
                    <Link to={createPageUrl("AddProduct")}>
                        <Button className="bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90 text-white">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Your First Product
                        </Button>
                    </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-3 md:gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    retailers={retailers}
                    onViewDetails={setSelectedProduct}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={loadInitialData} // Use loadInitialData for refresh
                    activeProductsCount={stats.activeProducts} 
                    totalProductsCount={stats.totalProducts} 
                    isFreeUser={isFreeUser} 
                    freePlanProductLimit={FREE_PLAN_PRODUCT_LIMIT}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:block">
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </div>
      
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-purple-200/50 text-center">
        <p className="text-sm text-gray-500">
          © 2024 SlashAlert. All rights reserved. Prices are checked periodically and may not reflect real-time changes.
        </p>
        <Button 
          variant="link" 
          className="text-primary-blue text-sm p-0 h-auto mt-1"
          onClick={() => setIsDisclaimerOpen(true)}
        >
          Disclaimer and Terms of Use
        </Button>
      </footer>

      <DeleteConfirmationDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        productName={productToDelete?.name || ''}
      />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
        onSave={handleSaveEdit}
      />
      <DisclaimerModal 
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
}
