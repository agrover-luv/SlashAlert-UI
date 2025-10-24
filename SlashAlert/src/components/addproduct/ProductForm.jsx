
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Package, DollarSign, Target, Link as LinkIcon, Image, Save, Clock, Plus, Play, CheckCircle, AlertCircle, Loader2, Zap, Sparkles, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { User } from "@/api/entities";
import { Retailer } from "@/api/entities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PriceComparisonTable from "./PriceComparisonTable";

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "home", label: "Home & Garden" },
  { value: "books", label: "Books" },
  { value: "sports", label: "Sports" },
  { value: "beauty", label: "Beauty" },
  { value: "toys", label: "Toys" },
  { value: "automotive", label: "Automotive" },
  { value: "other", label: "Other" }
];

export default function ProductForm({ onSubmit, isSubmitting, productToEdit, initialProductName, isLimitReached }) {
  const getInitialFormData = () => {
    if (productToEdit) {
      // Fix date handling to avoid timezone issues
      let purchasedDate = format(new Date(), 'yyyy-MM-dd');
      if (productToEdit.purchased_date) {
        // Parse the date string directly without timezone conversion
        const dateParts = productToEdit.purchased_date.split('-');
        if (dateParts.length === 3) {
          purchasedDate = productToEdit.purchased_date;
        }
      }
      
      return {
        ...productToEdit,
        current_price: productToEdit.current_price?.toString() || '',
        original_price: productToEdit.original_price?.toString() || '',
        target_price: productToEdit.target_price?.toString() || '',
        target_price_percentage: productToEdit.target_price_percentage?.toString() || '',
        purchased_date: purchasedDate,
        memory_size: productToEdit.memory_size || '',
        storage_size: productToEdit.storage_size || '',
        processor_type: productToEdit.processor_type || '',
        screen_size: productToEdit.screen_size || ''
      };
    }
    return {
      name: '',
      url: '',
      retailer: '',
      current_price: '',
      original_price: '',
      target_price: '',
      target_price_type: 'absolute',
      target_price_percentage: '',
      image_url: '',
      category: '',
      purchased_date: format(new Date(), 'yyyy-MM-dd'),
      is_active: true,
      memory_size: '',
      storage_size: '',
      processor_type: '',
      screen_size: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [targetPriceMode, setTargetPriceMode] = useState(productToEdit?.target_price_type || 'absolute');
  const [errors, setErrors] = useState({});
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [priceCheckResult, setPriceCheckResult] = useState(null);
  const [priceCheckError, setPriceCheckError] = useState(null);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutResults, setScoutResults] = useState([]);
  const [scoutError, setScoutError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [retailers, setRetailers] = useState([]); // State for dynamic retailers

  useEffect(() => {
    const fetchUserAndRetailers = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch current user:", e);
      }
      try {
        const retailerData = await Retailer.list();
        setRetailers(retailerData);
      } catch (e) {
        console.error("Failed to fetch retailers:", e);
      }
    };
    fetchUserAndRetailers();
    
    setFormData(getInitialFormData());
    if (productToEdit) {
      setTargetPriceMode(productToEdit.target_price_type || 'absolute');
    }
    setPriceCheckResult(null);
    setPriceCheckError(null);
    setScoutResults([]);
    setScoutError(null);
  }, [productToEdit]);
  
  useEffect(() => {
    if (initialProductName && !productToEdit) {
      handleChange('name', initialProductName);
      handleFindBestPrice(initialProductName);
    }
  }, [initialProductName, productToEdit]);

  const isPremiumUser = currentUser?.subscription_plan === 'premium'; // Kept as it might be used for other premium features
  const isElectronicsCategory = formData.category === 'electronics';

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.url.trim()) newErrors.url = 'Product URL is required';
    if (!formData.retailer) newErrors.retailer = 'Please select a retailer';
    if (!formData.current_price || parseFloat(formData.current_price) <= 0) newErrors.current_price = 'Valid current price is required';
    if (!formData.original_price || parseFloat(formData.original_price) <= 0) newErrors.original_price = 'Valid purchased price is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.purchased_date) newErrors.purchased_date = 'Purchased date is required';
    
    try {
      new URL(formData.url);
    } catch {
      newErrors.url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const detectRetailerFromUrl = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes('amazon.')) return 'amazon';
      if (domain.includes('ebay.')) return 'ebay';
      if (domain.includes('walmart.')) return 'walmart';
      if (domain.includes('target.')) return 'target';
      if (domain.includes('bestbuy.')) return 'bestbuy';
      if (domain.includes('costco.')) return 'costco';
      if (domain.includes('samsclub.') || domain.includes('sams.')) return 'sams_club';
      if (domain.includes('ikea.')) return 'ikea';
      
      return 'other';
    } catch (error) {
      return 'other';
    }
  };

  const handleRunNow = async () => {
    if (!formData.url.trim()) {
      setPriceCheckError('Please enter a product URL first');
      return;
    }

    setIsCheckingPrice(true);
    setPriceCheckError(null);
    setPriceCheckResult(null);

    try {
      const result = await InvokeLLM({
        prompt: `You are an expert web scraper. Your task is to extract key product details from this page: ${formData.url}

**Primary Goal: Find the most accurate, final purchase price.**
Follow these steps for price extraction:
1.  **Identify the main product area.** Ignore prices in carousels or "related items" sections. Focus on the main price near the product title.
2.  **Search for common price identifiers.** Look for text like "Price:", "Sale:", "Now:" and HTML classes/IDs like \`priceblock_ourprice\`, \`priceblock_dealprice\`, \`priceView-hero-price\`.
3.  **Prioritize the sale price.** If a regular price and a sale price are shown, ALWAYS return the sale price.
4.  **Clean the price value.** The final price must be a number only, with no currency symbols or commas.
5.  **Handle unavailability.** If the price is not found or the item is out of stock, return null for the price.

**Secondary Goal: Extract additional details.**
In addition to the price, please also find:
-   \`product_name\`: The full name of the product.
-   \`image_url\`: The URL of the main product image.
-   \`in_stock\`: A boolean (true/false) indicating if the item is available.
-   \`discount_info\`: Any text describing a discount (e.g., "Save $50").
-   \`category\`: Classify the product into one of these: electronics, clothing, home, books, sports, beauty, toys, automotive, other.

Return all extracted information in the specified JSON format. If a value cannot be found, return null for that field.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: {
              anyOf: [
                { type: "number" },
                { type: "null" }
              ],
              description: "Current price of the product"
            },
            product_name: {
              anyOf: [
                { type: "string" },
                { type: "null" }
              ],
              description: "Name of the product"
            },
            image_url: {
              anyOf: [
                { type: "string", format: "uri" },
                { type: "null" }
              ],
              description: "URL of the main product image"
            },
            in_stock: {
              anyOf: [
                { type: "boolean" },
                { type: "null" }
              ],
              description: "Whether the product is in stock"
            },
            discount_info: {
              anyOf: [
                { type: "string" },
                { type: "null" }
              ],
              description: "Any discount or sale information"
            },
            category: {
              anyOf: [
                { 
                  type: "string", 
                  enum: ["electronics", "clothing", "home", "books", "sports", "beauty", "toys", "automotive", "other"]
                },
                { type: "null" }
              ],
              description: "Product category classification"
            }
          }
        }
      });

      if (result && result.price && result.price > 0) {
        setPriceCheckResult(result);
        handleChange('current_price', result.price.toString());
        if (!formData.name.trim() && result.product_name) {
          handleChange('name', result.product_name);
        }
        if (result.image_url) {
          handleChange('image_url', result.image_url);
        }
        // Auto-detect and set retailer from URL
        if (!formData.retailer) {
          const detectedRetailer = detectRetailerFromUrl(formData.url);
          handleChange('retailer', detectedRetailer);
        }
        // Auto-detect and set category from product details
        if (!formData.category && result.category) {
          handleChange('category', result.category);
        }
      } else {
        setPriceCheckError('Could not extract price from the provided URL. Please check the URL and try again.');
      }
    } catch (error) {
      setPriceCheckError('Failed to check price. Please try again later.');
      console.error('Price check error:', error);
    }

    setIsCheckingPrice(false);
  };

  const handleFindBestPrice = async (productNameFromVoice) => {
    const productName = productNameFromVoice || formData.name;
    if (!productName.trim()) {
      setScoutError('Please enter a product name first.');
      return;
    }

    setIsScouting(true);
    setScoutError(null);
    setScoutResults([]);

    try {
      // Build enhanced search query with specifications for electronics
      let searchQuery = `"${productName}"`;
      if (isElectronicsCategory) {
        if (formData.memory_size) searchQuery += ` "${formData.memory_size}"`;
        if (formData.storage_size) searchQuery += ` "${formData.storage_size}"`;
        if (formData.processor_type) searchQuery += ` "${formData.processor_type}"`;
        if (formData.screen_size) searchQuery += ` "${formData.screen_size}"`;
      }

      const result = await InvokeLLM({
        prompt: `For the product: ${searchQuery}, find its price across the following major online retailers: Amazon, Walmart, Target, Best Buy, eBay, Costco, Sam's Club, Ikea. 
        
        ${isElectronicsCategory && (formData.memory_size || formData.storage_size || formData.processor_type || formData.screen_size) ? 
        `IMPORTANT: This is an electronics product with these specifications:
        ${formData.memory_size ? `- Memory: ${formData.memory_size}` : ''}
        ${formData.storage_size ? `- Storage: ${formData.storage_size}` : ''}
        ${formData.processor_type ? `- Processor: ${formData.processor_type}` : ''}
        ${formData.screen_size ? `- Screen Size: ${formData.screen_size}` : ''}
        
        Make sure to find products that match these exact specifications or very similar ones.` : ''}
        
        Return a list of all prices you can find. For each item, provide:
        1. The name of the retailer (e.g., 'amazon', 'walmart'). Must be one of the searched retailers.
        2. The price (as a number, no currency symbols).
        3. A direct URL to the product page.`
        ,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            prices: {
              type: "array",
              description: "A list of prices found for the product across different retailers.",
              items: {
                type: "object",
                properties: {
                  retailer: { "type": "string" },
                  price: { "type": "number" },
                  url: { "type": "string", format: "uri" },
                }
              },
            },
          },
          required: ["prices"],
        },
      });

      if (result && result.prices && result.prices.length > 0) {
        setScoutResults(result.prices);
      } else {
        setScoutError('Could not find any comparable products. Try making the product name more specific.');
      }
    } catch (error) {
      setScoutError('An unexpected error occurred while scouting for prices. Please try again.');
      console.error('Price scout error:', error);
    }

    setIsScouting(false);
  };

  const handleSelectPriceFromTable = (selectedResult) => {
    if (!selectedResult) return;
    
    const scoutedRetailerLower = selectedResult.retailer.toLowerCase();
    let matchedRetailer = retailers.find(r => 
        scoutedRetailerLower.includes(r.name.replace('_', '')) ||
        r.label.toLowerCase().includes(scoutedRetailerLower)
    )?.name || 'other'; // Changed r.value to r.name

    if (scoutedRetailerLower.includes("sam's club") || scoutedRetailerLower.includes("sams club")) {
        matchedRetailer = "sams_club";
    }

    setFormData(prev => ({
      ...prev,
      url: selectedResult.url,
      current_price: selectedResult.price.toString(),
      original_price: prev.original_price || selectedResult.price.toString(),
      retailer: matchedRetailer
    }));
    setScoutResults([]);
    setErrors(prev => ({ ...prev, url: null, current_price: null, original_price: null, retailer: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Ensure we have current user information
    if (!currentUser || !currentUser.email) {
      console.error('Cannot create product: No current user information available');
      alert('Error: User information not available. Please refresh the page and try again.');
      return;
    }

    const { check_frequency, ...restOfData } = formData; // Destructure to remove check_frequency

    let finalTargetPrice = null;
    if (targetPriceMode === 'absolute' && restOfData.target_price) {
      finalTargetPrice = parseFloat(restOfData.target_price);
    } else if (targetPriceMode === 'percentage' && restOfData.target_price_percentage && restOfData.original_price) {
        const percentage = parseFloat(restOfData.target_price_percentage);
        const originalPrice = parseFloat(restOfData.original_price);
        if (!isNaN(percentage) && !isNaN(originalPrice) && percentage >= 0 && originalPrice > 0) {
            finalTargetPrice = originalPrice * (1 - (percentage / 100));
        }
    }

    const submitData = {
      ...restOfData,
      created_by: currentUser.email, // Add current user's email as created_by
      current_price: parseFloat(restOfData.current_price),
      original_price: parseFloat(restOfData.original_price),
      target_price: finalTargetPrice ? parseFloat(finalTargetPrice.toFixed(2)) : null,
      target_price_type: targetPriceMode,
      target_price_percentage: restOfData.target_price_percentage ? parseFloat(restOfData.target_price_percentage) : null,
      last_checked: new Date().toISOString(),
      purchased_date: restOfData.purchased_date,
      // Only include electronics specs if category is electronics
      memory_size: isElectronicsCategory ? restOfData.memory_size : null,
      storage_size: isElectronicsCategory ? restOfData.storage_size : null,
      processor_type: isElectronicsCategory ? restOfData.processor_type : null,
      screen_size: isElectronicsCategory ? restOfData.screen_size : null
    };

    console.log('Submitting product with created_by:', submitData.created_by); // Debug log
    
    onSubmit(productToEdit ? { ...submitData, id: productToEdit.id } : submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const isEditing = !!productToEdit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-neutral-200 shadow-xl">
        <CardHeader className="p-6 border-b border-neutral-200">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Package className="w-6 h-6 text-primary-blue" />
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-neutral-700 font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Product URL *
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://example.com/product"
                    className={`flex-1 min-w-[375px] ${errors.url ? 'border-danger-red' : 'border-neutral-375'}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRunNow}
                    disabled={isCheckingPrice || !formData.url.trim() || (isEditing && !formData.is_active)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-300 to-blue-400 text-white hover:from-blue-400 hover:to-blue-500 border-none"
                  >
                    {isCheckingPrice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span className="ml-2">Fetch From URL</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleFindBestPrice()}
                    disabled={isScouting || !formData.name.trim() || (isEditing && !formData.is_active)}
                    className="px-4 py-2 bg-gradient-to-r from-primary-blue to-accent-blue text-white hover:from-primary-blue/90 hover:to-accent-blue/90 border-none"
                  >
                    {isScouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="ml-2">Find Best Price</span>
                  </Button>
                </div>
                {errors.url && <p className="text-sm text-danger-red">{errors.url}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-700 font-medium">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className={errors.name ? 'border-danger-red' : 'border-neutral-300'}
                  />
                  {errors.name && <p className="text-sm text-danger-red">{errors.name}</p>}
                </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-neutral-700 font-medium">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className={errors.category ? 'border-danger-red' : 'border-neutral-300'}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-danger-red">{errors.category}</p>}
              </div>
            </div>

            {/* Electronics Specifications - Only show when category is electronics */}
            {isElectronicsCategory && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Electronics Specifications
                  <span className="text-sm font-normal text-neutral-500">(Optional but helps find accurate price comparisons)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memory_size" className="text-neutral-700 font-medium">
                      Memory (RAM)
                    </Label>
                    <Input
                      id="memory_size"
                      value={formData.memory_size}
                      onChange={(e) => handleChange('memory_size', e.target.value)}
                      placeholder="e.g., 8GB, 16GB, 32GB"
                      className="border-neutral-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storage_size" className="text-neutral-700 font-medium">
                      Storage
                    </Label>
                    <Input
                      id="storage_size"
                      value={formData.storage_size}
                      onChange={(e) => handleChange('storage_size', e.target.value)}
                      placeholder="e.g., 256GB SSD, 1TB HDD"
                      className="border-neutral-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processor_type" className="text-neutral-700 font-medium">
                      Processor
                    </Label>
                    <Input
                      id="processor_type"
                      value={formData.processor_type}
                      onChange={(e) => handleChange('processor_type', e.target.value)}
                      placeholder="e.g., Intel i7, AMD Ryzen 5, Apple M2"
                      className="border-neutral-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screen_size" className="text-neutral-700 font-medium">
                      Screen Size
                    </Label>
                    <Input
                      id="screen_size"
                      value={formData.screen_size}
                      onChange={(e) => handleChange('screen_size', e.target.value)}
                      placeholder="e.g., 13.3 inch, 15.6 inch, 6.1 inch"
                      className="border-neutral-300"
                    />
                  </div>
                </div>
              </div>
            )}

            

            {/* Price Scout Table */}
            {scoutResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <PriceComparisonTable results={scoutResults} onSelect={handleSelectPriceFromTable} />
              </motion.div>
            )}
            
            {scoutError && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{scoutError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Price Check Results */}
            {priceCheckResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="bg-success-green/10 border-success-green/20 text-success-green">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Current Price:</span>
                        <span className="text-2xl font-bold">${priceCheckResult.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Source URL:</span>
                        <a href={formData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-blue hover:underline">
                            Open Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {priceCheckResult.product_name && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Product:</span>
                          <span className="text-sm">{priceCheckResult.product_name}</span>
                        </div>
                      )}
                      {priceCheckResult.in_stock !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">In Stock:</span>
                          <span className={`text-sm ${priceCheckResult.in_stock ? 'text-success-green' : 'text-danger-red'}`}>
                            {priceCheckResult.in_stock ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                      {priceCheckResult.discount_info && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Discount:</span>
                          <span className="text-sm">{priceCheckResult.discount_info}</span>
                        </div>
                      )}
                      {priceCheckResult.image_url && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Image URL:</span>
                          <a href={priceCheckResult.image_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-blue hover:underline text-sm truncate max-w-[150px]">
                            {priceCheckResult.image_url}
                          </a>
                        </div>
                      )}
                      {priceCheckResult.category && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Category:</span>
                          <span className="text-sm capitalize">{priceCheckResult.category}</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {priceCheckError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{priceCheckError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retailer" className="text-neutral-700 font-medium">
                  Retailer *
                </Label>
                <Select value={formData.retailer} onValueChange={(value) => handleChange('retailer', value)}>
                  <SelectTrigger className={errors.retailer ? 'border-danger-red' : 'border-neutral-300'}>
                    <SelectValue placeholder="Select retailer" />
                  </SelectTrigger>
                    <SelectContent>
                      {retailers.map((retailer) => (
                        <SelectItem key={retailer.name} value={retailer.name}>
                          {retailer.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.retailer && <p className="text-sm text-danger-red">{errors.retailer}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchased_date" className="text-neutral-700 font-medium">Purchased/Potential Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${errors.purchased_date ? 'border-danger-red' : 'border-neutral-300'}`}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.purchased_date ? (() => {
                        // Parse date string to avoid timezone issues
                        const dateParts = formData.purchased_date.split('-');
                        if (dateParts.length === 3) {
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                          const day = parseInt(dateParts[2]);
                          return format(new Date(year, month, day), "PPP");
                        }
                        // Fallback for malformed date, though it should ideally be yyyy-MM-dd
                        return format(new Date(formData.purchased_date + 'T12:00:00'), "PPP");
                      })() : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.purchased_date ? (() => {
                        // Parse date string to avoid timezone issues
                        const dateParts = formData.purchased_date.split('-');
                        if (dateParts.length === 3) {
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                          const day = parseInt(dateParts[2]);
                          return new Date(year, month, day);
                        }
                        // Fallback for malformed date - add noon time to avoid timezone issues
                        return new Date(formData.purchased_date + 'T12:00:00');
                      })() : null}
                      onSelect={(date) => {
                        if (date) {
                          // Format date to avoid timezone issues
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateString = `${year}-${month}-${day}`;
                          handleChange('purchased_date', dateString);
                        } else {
                          handleChange('purchased_date', '');
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.purchased_date && <p className="text-sm text-danger-red">{errors.purchased_date}</p>}
              </div>
            </div>

            {/* Price Fields - Aligned and Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="original_price" className="text-neutral-700 font-medium flex items-center gap-2 h-6">
                  <DollarSign className="w-4 h-4" />
                  Purchased/Potential Price*
                </Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.original_price}
                  onChange={(e) => handleChange('original_price', e.target.value)}
                  placeholder="0.00"
                  className={`w-full max-w-[120px] ${errors.original_price ? 'border-danger-red' : 'border-neutral-300'}`}
                />
                {errors.original_price && <p className="text-sm text-danger-red">{errors.original_price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_price" className="text-neutral-700 font-medium flex items-center gap-2 h-6">
                  <DollarSign className="w-4 h-4" />
                  Current Price*
                </Label>
                <Input
                  id="current_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_price}
                  onChange={(e) => handleChange('current_price', e.target.value)}
                  placeholder="0.00"
                  className={`w-full max-w-[120px] ${errors.current_price ? 'border-danger-red' : 'border-neutral-300'}`}
                  disabled={isEditing && !formData.is_active}
                />
                {errors.current_price && <p className="text-sm text-danger-red">{errors.current_price}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 h-6">
                  <Label className="text-neutral-700 font-medium">
                    Target Price
                  </Label>
                  <RadioGroup
                    value={targetPriceMode}
                    onValueChange={(value) => {
                      setTargetPriceMode(value);
                      if (value === 'absolute') {
                        handleChange('target_price_percentage', '');
                      } else {
                        handleChange('target_price', '');
                      }
                    }}
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="absolute" id="absolute" />
                      <Label htmlFor="absolute" className="font-normal cursor-pointer text-sm">$</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage" className="font-normal cursor-pointer text-sm">%</Label>
                    </div>
                  </RadioGroup>
                </div>

                {targetPriceMode === 'absolute' ? (
                  <Input
                    id="target_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.target_price}
                    onChange={(e) => handleChange('target_price', e.target.value)}
                    placeholder="0.00"
                    className="border-neutral-300 bg-white w-full max-w-[120px]"
                  />
                ) : (
                  <Input
                    id="target_price_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.target_price_percentage}
                    onChange={(e) => handleChange('target_price_percentage', e.target.value)}
                    placeholder="15%"
                    className="border-neutral-300 bg-white w-full max-w-[120px]"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-neutral-700 font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image URL (optional)
              </Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="border-neutral-300"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="text-neutral-700 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Active Tracking
                </Label>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || (isLimitReached && !isEditing)}
              className="w-full bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90 text-white py-3 font-semibold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (isEditing ? 'Saving...' : 'Adding...')
                : (isEditing ? 'Save Changes' : 'Start Tracking Product')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
