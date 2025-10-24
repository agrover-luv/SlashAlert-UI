
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ExternalLink, Bell, MoreHorizontal, Pencil, Trash2, Clock, Play, CheckCircle, AlertCircle, Loader2, Zap, Sparkles, ShieldOff, RefreshCw } from "lucide-react";
import { format, addDays, isPast, formatDistanceToNow } from "date-fns";
import { InvokeLLM } from "@/api/integrations";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { AlertService } from "../alerts/AlertService";
import { checkAndUpdateProductPrice } from "../products/PriceCheckService"; // Import the new service
import { toast } from "sonner"; // Using sonner for toasts
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const retailerColors = {
  amazon: "bg-orange-100 text-orange-800 border-orange-200",
  ebay: "bg-yellow-100 text-yellow-800 border-yellow-200",
  walmart: "bg-blue-100 text-blue-800 border-blue-200",
  target: "bg-red-100 text-red-800 border-red-200",
  bestbuy: "bg-blue-100 text-blue-800 border-blue-200",
  costco: "bg-red-100 text-red-800 border-red-200",
  sams_club: "bg-green-100 text-green-800 border-green-200",
  ikea: "bg-sky-100 text-sky-800 border-sky-200",
  other: "bg-gray-100 text-gray-800 border-gray-200"
};

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ProductCard({ product, retailers, onViewDetails, onEdit, onDelete, onRefresh, activeProductsCount }) {
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [priceCheckResult, setPriceCheckResult] = useState(null); // This state is kept but its UI display is removed
  const [priceCheckError, setPriceCheckError] = useState(null);   // This state is kept but its UI display is removed
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [priceComparisonResults, setPriceComparisonResults] = useState([]);
  const [priceComparisonTimestamp, setPriceComparisonTimestamp] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isTogglingAutoCheck, setIsTogglingAutoCheck] = useState(false);
  const [guaranteeStatus, setGuaranteeStatus] = useState({
    isExpired: false,
    daysLeft: null,
    expirationDate: null
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch user:", e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const checkGuaranteeStatus = async () => {
      if (!retailers || retailers.length === 0) return;

      const retailerInfo = retailers.find(r => r.name.toLowerCase() === product.retailer.toLowerCase());
      if (!retailerInfo || !product.purchased_date || retailerInfo.price_guarantee_days === undefined || retailerInfo.price_guarantee_days === null) {
        setGuaranteeStatus({ isExpired: false, daysLeft: null, expirationDate: null }); // Reset if no guarantee info
        return;
      }

      const purchaseDate = new Date(product.purchased_date);
      const expirationDate = addDays(purchaseDate, retailerInfo.price_guarantee_days);
      const isExpired = isPast(expirationDate);

      setGuaranteeStatus({
        isExpired,
        expirationDate,
        daysLeft: isExpired ? 0 : formatDistanceToNow(expirationDate, { addSuffix: false })
      });
      
      // If it's expired and tracking is still active, deactivate it
      if (isExpired && product.is_active) {
        try {
          await Product.update(product.id, { is_active: false });
          if (onRefresh) onRefresh();
        } catch (error) {
          console.error(`Failed to deactivate product ${product.id}:`, error);
        }
      }
    };
    
    checkGuaranteeStatus();
  }, [product, retailers, onRefresh]);

  // Check if price comparison results are expired (older than 30 minutes)
  useEffect(() => {
    if (priceComparisonTimestamp && priceComparisonResults.length > 0) {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000); // 30 minutes in milliseconds
      if (priceComparisonTimestamp < thirtyMinutesAgo) {
        setPriceComparisonResults([]);
        setPriceComparisonTimestamp(null);
        setShowComparison(false);
      }
    }
  }, [priceComparisonTimestamp, priceComparisonResults]);

  const isPremiumUser = currentUser?.subscription_plan === 'premium';
  const hasReachedLimit = !isPremiumUser && activeProductsCount >= 5;

  // Calculate price differences and potential savings
  const priceChange = product.current_price - product.original_price;
  const priceChangePercent = product.original_price > 0 ? ((priceChange / product.original_price) * 100).toFixed(1) : 0;
  const isDecrease = priceChange < 0;
  const isIncrease = priceChange > 0;
  
  // Show potential saving only when tracking is active AND current price is less than original price
  const potentialSaving = product.is_active && product.current_price < product.original_price 
    ? product.original_price - product.current_price 
    : 0;

  // Show "Saved" amount when tracking is inactive and a saving was achieved
  const actualSaving = !product.is_active && product.current_price < product.original_price
    ? product.original_price - product.current_price
    : 0;

  // Show "No Savings yet" when there's no price drop (price is same or higher)
  const noSavingsYet = product.current_price >= product.original_price;

  const handleRunNow = async () => {
    setIsCheckingPrice(true);
    toast.info(`Checking price for ${product.name}...`);
    
    const result = await checkAndUpdateProductPrice(product);

    if (result.success) {
      toast.success(`Price updated for ${product.name}!`, {
        description: `New price is $${result.newPrice.toFixed(2)}.`,
      });
      if (onRefresh) onRefresh(); // Refresh the dashboard data
    } else {
      toast.error(`Failed to update price for ${product.name}.`, {
        description: result.error || "Please check the product URL and try again.",
      });
    }

    setIsCheckingPrice(false);
  };

  // New handler for toggling automatic price check
  const handleToggleAutoCheck = async () => {
    const newActiveState = !product.is_active;

    // Check limit only when trying to ACTIVATE a product
    if (newActiveState && hasReachedLimit) {
      alert("You have reached your limit of 5 active products for the free plan. Please upgrade to track more items or disable tracking on an existing product.");
      return;
    }

    setIsTogglingAutoCheck(true);
    try {
      await Product.update(product.id, { is_active: newActiveState });
      if (onRefresh) {
        // Notify parent to refresh data, as product.is_active has changed
        onRefresh(); 
      }
    } catch (error) {
      console.error('Failed to toggle auto price check:', error);
      // Implement a more user-friendly error notification if needed
    } finally {
      setIsTogglingAutoCheck(false);
    }
  };

  const handleComparePrices = async () => {
    // Check if we have recent results (less than 30 minutes old)
    if (priceComparisonResults.length > 0 && priceComparisonTimestamp) {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      if (priceComparisonTimestamp > thirtyMinutesAgo) {
        setShowComparison(true);
        return;
      }
    }

    setIsComparingPrices(true);
    setPriceComparisonResults([]);
    
    try {
      // Detect if the current product is refurbished/used
      const productNameLower = product.name.toLowerCase();
      const isRefurbished = productNameLower.includes('refurbished') || 
                           productNameLower.includes('recertified') || 
                           productNameLower.includes('renewed') || 
                           productNameLower.includes('used') || 
                           productNameLower.includes('open box');

      let promptText = `Find FINAL CHECKOUT PRICES for "${product.name}" OR similar/equivalent products across major online retailers: Amazon, Walmart, Target, Best Buy, eBay, Costco, Sam's Club, Ikea.

CRITICAL: Return the EXACT DOLLAR AMOUNT customers would pay at checkout, NOT discount percentages.

SEARCH STRATEGY:
- Look for the exact product name first
- If not found, search for similar models or equivalent products
- For electronics, prioritize products with similar specifications
- ${isRefurbished 
  ? 'ONLY include refurbished, renewed, recertified, used, or open-box products' 
  : 'ONLY include NEW products - exclude refurbished, renewed, recertified, used, or open-box items'}
- Aim to find at least 3-5 results from different retailers

PRICING INSTRUCTIONS:
- Find the FINAL PRICE customers pay after all discounts are applied
- Look for "Sale Price", "Your Price", "Current Price", "Deal Price"
- If you see "Was $X, Now $Y" → return Y (the lower price)
- Include prices with automatic coupons already applied
- Return the checkout price as a number (e.g., 299.99)
- DO NOT return discount amounts or percentages`;
      
      if (product.category === 'electronics') {
        const specs = [
          product.memory_size && `Memory (RAM): ${product.memory_size}`,
          product.storage_size && `Storage: ${product.storage_size}`,
          product.processor_type && `Processor: ${product.processor_type}`,
          product.screen_size && `Screen Size: ${product.screen_size}`,
        ].filter(Boolean);

        if (specs.length > 0) {
          promptText += `\n\nELECTRONICS SPECIFICATIONS TO MATCH:
${specs.join('\n')}

MATCHING GUIDELINES:
- Exact spec match is preferred but not required
- Similar specs are acceptable (e.g., 8GB vs 16GB RAM, 256GB vs 512GB storage)
- Same product line/series is good (e.g., MacBook Air vs MacBook Pro)
- Include both current and previous generation models
- Consider different configurations of the same product`;
        }
      }
      
      promptText += `\n\nPRODUCT CONDITION REQUIREMENT:
${isRefurbished 
  ? '- MUST be refurbished, renewed, recertified, used, or open-box condition' 
  : '- MUST be NEW condition only - do NOT include any refurbished, renewed, recertified, used, or open-box items'}

RETURN FORMAT:
For each retailer where you find relevant products, provide:
1. retailer: One of (amazon, walmart, target, bestbuy, ebay, costco, sams_club, ikea)
2. price: FINAL CHECKOUT PRICE as a number (e.g., 299.99) - NOT discount amount
3. url: Direct product page URL
4. match_quality: "exact", "similar", or "equivalent"

EXAMPLES:
- If Amazon shows "Was $1000, Sale $750" → return price: 750
- If Best Buy shows "Price: $499.99" → return price: 499.99
- If Target shows "$299 after 25% off" → return price: 299 (the final price)

IMPORTANT:
- Return FINAL CHECKOUT PRICES, not original prices or discount amounts
- Include results from at least 3-5 different retailers if available
- Follow the product condition requirements strictly`;

      const result = await InvokeLLM({
        prompt: promptText,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            prices: {
              type: "array",
              description: "List of final checkout prices found across retailers",
              items: {
                type: "object",
                properties: {
                  retailer: { type: "string" },
                  price: { type: "number" },
                  url: { type: "string", format: "uri" },
                  match_quality: { type: "string", enum: ["exact", "similar", "equivalent"] }
                },
                required: ["retailer", "price", "url"]
              }
            }
          },
          required: ["prices"]
        }
      });

      if (result && result.prices && result.prices.length > 0) {
        // Filter out invalid results and sort by match quality and price
        const validPrices = result.prices.filter(item => 
          item.retailer && 
          typeof item.price === 'number' && 
          item.price > 0 &&
          item.url
        );

        // Sort by match quality first (exact > similar > equivalent), then by price
        const sortedPrices = validPrices.sort((a, b) => {
          const qualityOrder = { exact: 3, similar: 2, equivalent: 1 };
          const qualityA = qualityOrder[a.match_quality] || 0;
          const qualityB = qualityOrder[b.match_quality] || 0;
          
          if (qualityA !== qualityB) {
            return qualityB - qualityA; // Higher quality first
          }
          return a.price - b.price; // Then lower price first
        });

        // Get best price per retailer (lowest price for that retailer), then take top 5 overall results
        const bestPricesByRetailer = new Map();
        sortedPrices.forEach(item => {
          const retailerKey = item.retailer.toLowerCase().trim();
          if (!bestPricesByRetailer.has(retailerKey) || item.price < bestPricesByRetailer.get(retailerKey).price) {
            bestPricesByRetailer.set(retailerKey, item);
          }
        });

        const finalResults = Array.from(bestPricesByRetailer.values())
          .sort((a, b) => a.price - b.price) // Sort the unique best prices by price
          .slice(0, 5); // Take the top 5

        setPriceComparisonResults(finalResults);
        setPriceComparisonTimestamp(Date.now());
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Price comparison error:', error);
    }

    setIsComparingPrices(false);
  };

  // Calculate time remaining for cache
  const getTimeRemaining = () => {
    if (!priceComparisonTimestamp) return null;
    const thirtyMinutesFromTimestamp = priceComparisonTimestamp + (30 * 60 * 1000);
    const timeLeft = thirtyMinutesFromTimestamp - Date.now();
    const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
    return minutesLeft > 0 ? minutesLeft : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-neutral-200 hover:shadow-xl transition-all duration-300 group touch-manipulation">
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-neutral-900 group-hover:text-primary-blue transition-colors text-sm md:text-base line-clamp-2 flex-1 pr-2">
                  {product.name}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 touch-manipulation flex-shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* ADDED RUN NOW BUTTON */}
                    <DropdownMenuItem onClick={handleRunNow} disabled={isCheckingPrice}>
                      {isCheckingPrice ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      <span>Check Price Now</span>
                    </DropdownMenuItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <DropdownMenuItem onClick={() => onEdit(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-danger-red focus:text-danger-red focus:bg-danger-red/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={handleToggleAutoCheck} 
                              disabled={isTogglingAutoCheck || guaranteeStatus.isExpired || (hasReachedLimit && !product.is_active)}
                              className="disabled:cursor-not-allowed"
                            >
                              {isTogglingAutoCheck ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : product.is_active ? (
                                <CheckCircle className="mr-2 h-4 w-4 text-success-green" />
                              ) : (
                                <Play className="mr-2 h-4 w-4" />
                              )}
                              <span>{product.is_active ? 'Disable Alert' : 'Enable Alert'}</span>
                              {!isPremiumUser && !guaranteeStatus.isExpired && (
                                <Zap className="ml-auto h-4 w-4 text-warning-amber" />
                              )}
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          {guaranteeStatus.isExpired ? (
                            <p>Price guarantee has expired. Auto-alerts disabled.</p>
                          ) : hasReachedLimit && !product.is_active ? (
                            <p>Free plan limit of 5 active products reached.</p>
                          ) : null}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="group/badge">
                  <Badge 
                    variant="secondary"
                    className={`${retailerColors[product.retailer.toLowerCase()]} border text-xs group-hover/badge:opacity-80 transition-opacity flex items-center gap-1.5`}
                  >
                    {product.retailer}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300" />
                  </Badge>
                </a>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs cursor-default">
                        {product.purchased_date ? format(new Date(product.purchased_date), 'MMM d, yyyy') : 'N/A'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Purchased/Potential Date: {product.purchased_date ? format(new Date(product.purchased_date), 'MMM d, yyyy') : 'N/A'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {guaranteeStatus.isExpired ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="destructive" className="text-xs cursor-default bg-red-100 border-red-200 text-red-800">
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Guarantee Expired
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expired on {guaranteeStatus.expirationDate ? format(guaranteeStatus.expirationDate, 'MMM d, yyyy') : 'N/A'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : guaranteeStatus.expirationDate && guaranteeStatus.daysLeft !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs cursor-default border-green-300 text-green-700 bg-green-50">
                          <Clock className="w-3 h-3 mr-1" />
                          {guaranteeStatus.daysLeft} left
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Price guarantee expires on {format(guaranteeStatus.expirationDate, 'MMM d, yyyy')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                {product.is_active && !guaranteeStatus.isExpired && (
                  <Badge 
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 border-purple-200 text-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Tracking Active
                  </Badge>
                )}
                {potentialSaving > 0 && (
                  <Badge 
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200 text-xs flex items-center gap-1 font-semibold"
                  >
                    <TrendingDown className="w-3 h-3" />
                    Potential Saving: ${formatNumberWithCommas(potentialSaving)}
                  </Badge>
                )}
                {actualSaving > 0 && (
                    <Badge
                        variant="secondary"
                        className="bg-teal-100 text-teal-800 border-teal-200 text-xs flex items-center gap-1 font-semibold"
                    >
                        <CheckCircle className="w-3 h-3" />
                        Saved: ${formatNumberWithCommas(actualSaving)}
                    </Badge>
                )}
                {noSavingsYet && (
                  <Badge 
                    variant="outline"
                    className="bg-gray-50 text-gray-600 border-gray-200 text-xs flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    No Savings yet
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComparePrices}
                  disabled={isComparingPrices}
                  className="text-xs h-6 px-2 bg-gradient-to-r from-primary-blue/10 to-accent-blue/10 hover:from-primary-blue/20 hover:to-accent-blue/20 border-primary-blue/30 touch-manipulation"
                >
                  {isComparingPrices ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Compare
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-neutral-500">
                   Last Price :  
                   <span className="text-xs md:text-sm font-bold text-neutral-500">
                     ${formatNumberWithCommas(product.current_price)}
                    </span>
                   <span className="text-xs text-neutral-500">
                      {product.last_checked ? 
                        ` Updated ${format(new Date(product.last_checked), 'MMM d, h:mm a')}` : 
                        ' Never checked'
                      }
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs md:text-sm text-neutral-500">
                      Purchased at : ${formatNumberWithCommas(product.original_price)}
                    </p>
                  </div>
                </div>
                {priceChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs md:text-sm ${
                    isDecrease ? 'bg-success-green/10 text-success-green' : 'bg-danger-red/10 text-danger-red'
                  }`}>
                    {isDecrease ? (
                      <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                    <span className="font-medium">
                      {Math.abs(priceChangePercent)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {product.image_url && (
                <div className="w-12 h-12 md:w-16 md:h-16 bg-neutral-100 rounded-lg overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {product.target_price && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-light-blue/30 rounded-lg border border-primary-blue/20 text-center flex items-center gap-1 cursor-default">
                        <Bell className="w-3 h-3 text-primary-blue" />
                        <span className="text-xs font-medium text-primary-blue">
                          ${formatNumberWithCommas(product.target_price)}
                        </span>
                        {product.target_price_type === 'percentage' && (
                          <span className="text-xs font-bold text-primary-blue/70">
                            ({product.target_price_percentage}%)
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Target Price Alert</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 pt-0 pb-4">
          {/* Price Check Results are removed from here as they are now handled by toasts */}

          {/* Price Comparison Results */}
          {showComparison && priceComparisonResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              <div className="bg-gradient-to-r from-light-blue/20 to-primary-blue/10 border border-primary-blue/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-blue" />
                      Price Comparison
                    </h4>
                    {getTimeRemaining() !== null && getTimeRemaining() > 0 && (
                      <span className="text-xs text-neutral-500 bg-white/60 px-2 py-1 rounded-full">
                        Fresh for {getTimeRemaining()}m
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowComparison(false)}
                    className="text-neutral-500 hover:text-neutral-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {priceComparisonResults
                    .map((result, index) => ( // No longer sorting here, as it's already sorted by quality then price, and then top 5 lowest price per retailer
                      <div key={result.url} className="flex items-center justify-between bg-white/60 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize text-sm">{result.retailer}</span>
                          {index === 0 && ( // Still show "Best" for the first item in the *finalResults* list
                            <span className="text-xs bg-success-green text-white px-2 py-1 rounded-full">Best</span>
                          )}
                           {result.match_quality && result.match_quality !== 'exact' && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  result.match_quality === 'similar' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  'bg-sky-100 text-sky-800 border-sky-200'
                                }`}
                              >
                                {result.match_quality} Match
                              </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">${formatNumberWithCommas(result.price)}</span>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-blue hover:text-primary-blue/80"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => onViewDetails(product)}
              className="text-xs bg-primary-blue hover:bg-primary-blue/90 px-2 py-1 md:px-3 md:py-2 touch-manipulation"
            >
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
