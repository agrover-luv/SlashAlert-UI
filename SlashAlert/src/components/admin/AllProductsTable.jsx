
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search, ExternalLink, Trash2, ArrowUp, ArrowDown, Download } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getRetailerColor = (retailer) => {
  const colors = {
    amazon: "bg-orange-100 text-orange-800 border-orange-200",
    walmart: "bg-blue-100 text-blue-800 border-blue-200",
    target: "bg-red-100 text-red-800 border-red-200",
    bestbuy: "bg-blue-100 text-blue-800 border-blue-200",
    ebay: "bg-yellow-100 text-yellow-800 border-yellow-200",
    costco: "bg-red-100 text-red-800 border-red-200",
    sams_club: "bg-green-100 text-green-800 border-green-200",
    ikea: "bg-sky-100 text-sky-800 border-sky-200",
    other: "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colors[retailer?.toLowerCase()] || colors.other;
};

const getCategoryColor = (category) => {
  const colors = {
    electronics: "bg-blue-100 text-blue-800 border-blue-200",
    clothing: "bg-purple-100 text-purple-800 border-purple-200",
    home: "bg-green-100 text-green-800 border-green-200",
    books: "bg-yellow-100 text-yellow-800 border-yellow-200",
    sports: "bg-red-100 text-red-800 border-red-200",
    beauty: "bg-pink-100 text-pink-800 border-pink-200",
    toys: "bg-orange-100 text-orange-800 border-orange-200",
    automotive: "bg-gray-100 text-gray-800 border-gray-200",
    other: "bg-slate-100 text-slate-800 border-slate-200"
  };
  return colors[category?.toLowerCase()] || colors.other;
};

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AllProductsTable({ products, users }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'desc' });
  const [showDebugInfo, setShowDebugInfo] = useState(true); // Add debug toggle

  // Enhanced debugging with regular console.log
  console.log('🔍 === Admin Products Table Debug ===');
  console.log('📊 Total Users:', users.length);
  console.log('📦 Total Products:', products.length);
  
  console.log('👥 Users Data Sample:', users.slice(0, 3).map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    created_date: u.created_date
  })));
  
  console.log('📦 Products Data Sample:', products.slice(0, 3).map(p => ({
    id: p.id?.substring(0, 8) + '...',
    name: p.name?.substring(0, 30) + '...',
    created_by: p.created_by,
    created_date: p.created_date
  })));

  // Check for data integrity issues
  const productsWithoutCreatedBy = products.filter(p => !p.created_by);
  const usersWithoutEmail = users.filter(u => !u.email);
  
  if (productsWithoutCreatedBy.length > 0) {
    console.warn('⚠️ Products without created_by:', productsWithoutCreatedBy.length);
  }
  if (usersWithoutEmail.length > 0) {
    console.warn('⚠️ Users without email:', usersWithoutEmail.length);
  }

  // Create multiple lookup maps for better matching
  const userByEmail = useMemo(() => {
    const map = new Map();
    users.forEach(user => {
      if (user.email) {
        const email = user.email.toLowerCase().trim();
        map.set(email, user);
        // console.log(`📧 Mapped email: "${email}" -> ${user.full_name}`); // Commented to reduce console spam
      }
    });
    console.log('📧 Total email mappings:', map.size);
    return map;
  }, [users]);
  
  const userById = useMemo(() => {
    const map = new Map();
    users.forEach(user => {
      if (user.id) {
        map.set(user.id, user);
        // console.log(`🆔 Mapped ID: "${user.id}" -> ${user.full_name}`); // Commented to reduce console spam
      }
    });
    console.log('🆔 Total ID mappings:', map.size);
    return map;
  }, [users]);

  // Enhanced helper function to find user for a product
  const findUserForProduct = useMemo(() => (product) => {
    if (!product.created_by) {
      console.log(`❌ Product ${product.id} has no created_by field`);
      return null;
    }

    // console.log(`🔍 Looking for user for product "${product.name}" created_by: "${product.created_by}"`); // Commented to reduce console spam

    // Clean the created_by value for email comparison
    const createdByCleaned = product.created_by.toLowerCase().trim();
    
    // Try email lookup first
    const userByEmailLookup = userByEmail.get(createdByCleaned);
    if (userByEmailLookup) {
      // console.log(`✅ Found user by email: ${userByEmailLookup.full_name}`); // Commented to reduce console spam
      return userByEmailLookup;
    }
    
    // Try ID lookup as fallback
    const userByIdLookup = userById.get(product.created_by);
    if (userByIdLookup) {
      // console.log(`✅ Found user by ID: ${userByIdLookup.full_name}`); // Commented to reduce console spam
      return userByIdLookup;
    }
    
    // Manual search as last resort
    const manualFind = users.find(user => {
      if (!user) return false; // Ensure user object exists
      const userEmailCleaned = user.email ? user.email.toLowerCase().trim() : '';
      const match = userEmailCleaned === createdByCleaned || user.id === product.created_by;
      // if (match) {
      //   console.log(`✅ Found user via manual search: ${user.full_name}`); // Commented to reduce console spam
      // }
      return match;
    });
    
    if (!manualFind) {
      console.log(`❌ Could not find user for product "${product.name}" with created_by: "${product.created_by}"`);
      // console.log(`   Available emails:`, Array.from(userByEmail.keys()).slice(0, 5)); // Commented to reduce console spam
      // console.log(`   Available IDs:`, Array.from(userById.keys()).slice(0, 5)); // Commented to reduce console spam
    }
    
    return manualFind || null;
  }, [users, userByEmail, userById]);

  console.log('=== End Debug ===');

  // Test the lookup function on first few products
  const testResults = products.slice(0, 5).map(p => ({
    productName: p.name,
    createdBy: p.created_by,
    foundUser: findUserForProduct(p)?.full_name || 'NOT FOUND'
  }));
  console.log('🧪 Test Results for first 5 products:');
  testResults.forEach((result, index) => {
    console.log(`${index + 1}. Product: "${result.productName}" | Created by: "${result.createdBy}" | Found user: "${result.foundUser}"`);
  });

  // Filter products based on search term and deleted status
  const filteredProducts = useMemo(() => products.filter(product => {
    const productUser = findUserForProduct(product);
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (productUser?.full_name && productUser.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.retailer && product.retailer.toLowerCase().includes(searchTerm.toLowerCase())) || // Added null check for retailer
                         (product.created_by && product.created_by.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showDeleted) {
      return matchesSearch && product.deleted;
    } else {
      return matchesSearch && !product.deleted;
    }
  }), [products, searchTerm, showDeleted, findUserForProduct]);
  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedProducts = useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const getSortableValue = (product, key) => {
          switch (key) {
            case 'user': {
              const user = findUserForProduct(product);
              return user ? user.full_name.toLowerCase() : 'zzz_unknown'; // Sort unknown users to end
            }
            case 'name':
              return product.name ? product.name.toLowerCase() : '';
            case 'retailer':
              return product.retailer ? product.retailer.toLowerCase() : '';
            case 'category':
              return product.category ? product.category.toLowerCase() : '';
            case 'current_price':
              return product.current_price || 0;
            case 'is_active':
              return product.is_active ? 0 : 1; // Active first
            case 'created_date':
              return product.created_date ? new Date(product.created_date) : new Date(0); // Products without created_date go to the start
            case 'deleted_at':
              return product.deleted_at ? new Date(product.deleted_at) : new Date(0); // Undefined/null deleted_at products go to the start
            default:
              return product[key] ? String(product[key]).toLowerCase() : '';
          }
        };

        const aValue = getSortableValue(a, sortConfig.key);
        const bValue = getSortableValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig, findUserForProduct]);


  const activeProducts = products.filter(p => !p.deleted);
  const deletedProducts = products.filter(p => p.deleted);
  
  const SortableHeader = ({ sortKey, children }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <TableHead
        className="font-semibold text-neutral-800 cursor-pointer hover:bg-neutral-100 transition-colors"
        onClick={() => requestSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isSorted && (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
          )}
        </div>
      </TableHead>
    );
  };

  const exportToExcel = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Helper to map product data to CSV format
    const mapDataForCsv = (productsList) => {
      return productsList.map(product => {
        const productUser = findUserForProduct(product);
        return {
          'Product ID': product.id || '',
          'Product Name': product.name || '',
          'Created By': productUser?.full_name || 'Unknown User',
          'Creator Email': product.created_by || 'Missing',
          'Retailer': product.retailer || '',
          'Category': product.category || '',
          'Current Price': product.current_price || 0,
          'Original Price': product.original_price || 0,
          'Status': product.deleted ? 'Deleted' : (product.is_active ? 'Active' : 'Inactive'),
          'Created Date': product.created_date ? format(new Date(product.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
          'Deleted Date': product.deleted_at ? format(new Date(product.deleted_at), 'yyyy-MM-dd HH:mm:ss') : '',
          'Product URL': product.url || '',
        };
      });
    };
    
    // Helper to convert data array to CSV string
    const createCsvContent = (data) => {
      if (data.length === 0) return null;

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      return csvContent;
    };
    
    // Helper to trigger download
    const downloadFile = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const activeProductsToExport = products.filter(p => !p.deleted);
    const deletedProductsToExport = products.filter(p => p.deleted);

    if (activeProductsToExport.length === 0 && deletedProductsToExport.length === 0) {
      alert('No product data to export.');
      return;
    }

    if (activeProductsToExport.length > 0) {
      const activeCsvData = mapDataForCsv(activeProductsToExport);
      const activeCsvContent = createCsvContent(activeCsvData);
      downloadFile(activeCsvContent, `active-products-${today}.csv`);
    }

    if (deletedProductsToExport.length > 0) {
      const deletedCsvData = mapDataForCsv(deletedProductsToExport);
      const deletedCsvContent = createCsvContent(deletedCsvData);
      downloadFile(deletedCsvContent, `deleted-products-${today}.csv`);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader className="p-6 border-b border-neutral-200">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <Package className="w-6 h-6 text-success-green" />
          All Products ({products.length})
        </CardTitle>
        
        {/* Debug Information Panel */}
        {showDebugInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-800">🔍 Debug Information</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebugInfo(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                Hide Debug
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Total Users:</span>
                <span className="ml-2">{users.length}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Total Products:</span>
                <span className="ml-2">{products.length}</span>
              </div>
              <div>
                <span className="font-medium text-red-700">Missing created_by:</span>
                <span className="ml-2">{productsWithoutCreatedBy.length}</span>
              </div>
              <div>
                <span className="font-medium text-red-700">Users w/o email:</span>
                <span className="ml-2">{usersWithoutEmail.length}</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-blue-600">
                Check browser console for detailed matching logs. If users show "Unknown User", the created_by field might not match any user email/ID.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Search products or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Download className="w-4 h-4 mr-1" />
              Export All Data
            </Button>
            <Button
              variant={!showDeleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(false)}
            >
              Active ({activeProducts.length})
            </Button>
            <Button
              variant={showDeleted ? "destructive" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Deleted ({deletedProducts.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-96 relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-neutral-50 shadow-sm">
              <TableRow className="bg-neutral-50">
                <SortableHeader sortKey="name">Product</SortableHeader>
                <SortableHeader sortKey="user">Created by</SortableHeader>
                <SortableHeader sortKey="retailer">Retailer</SortableHeader>
                <SortableHeader sortKey="category">Category</SortableHeader>
                <SortableHeader sortKey="current_price">Price</SortableHeader>
                <SortableHeader sortKey="is_active">Status</SortableHeader>
                <SortableHeader sortKey="created_date">Created</SortableHeader>
                {showDeleted && <SortableHeader sortKey="deleted_at">Deleted</SortableHeader>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showDeleted ? 8 : 7} className="text-center py-8 text-neutral-500">
                    {searchTerm ? 'No products match your search.' : showDeleted ? 'No deleted products found.' : 'No products found.'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => {
                  const productUser = findUserForProduct(product);
                  return (
                    <TableRow key={product.id} className={`hover:bg-neutral-50 ${product.deleted ? 'opacity-75 bg-red-50' : ''}`}>
                      <TableCell>
                        <a 
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 group"
                        >
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          )}
                          <div>
                            <p className="font-medium text-neutral-900 line-clamp-2 max-w-xs group-hover:text-primary-blue group-hover:underline">
                              {product.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              ID: {product.id.substring(0, 8)}...
                            </p>
                          </div>
                        </a>
                      </TableCell>
                      <TableCell>
                        <div>
                          {product.created_by ? (
                            <>
                              <p className="font-medium text-neutral-900">
                                {productUser?.full_name || (
                                  <span className="text-red-600 font-normal">Unknown User</span>
                                )}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {product.created_by}
                              </p>
                              {!productUser && (
                                <p className="text-xs text-red-500">
                                  ⚠️ User lookup failed
                                </p>
                              )}
                            </>
                          ) : (
                            <div>
                              <p className="font-medium text-red-600">Data Missing</p>
                              <p className="text-xs text-red-500">
                                'created_by' field is empty
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getRetailerColor(product.retailer)}`}>
                          {product.retailer}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(product.category)}`}>
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-neutral-900">
                            ${formatNumberWithCommas(product.current_price)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            was ${formatNumberWithCommas(product.original_price)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {product.deleted ? (
                            <Badge variant="destructive" className="text-xs">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Deleted
                            </Badge>
                          ) : product.is_active ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(product.created_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(product.created_date), 'h:mm a')}
                        </p>
                      </TableCell>
                      {showDeleted && (
                        <TableCell>
                          {product.deleted_at && (
                            <div>
                              <p className="text-sm text-red-600">
                                {format(new Date(product.deleted_at), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-red-500">
                                {format(new Date(product.deleted_at), 'h:mm a')}
                              </p>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
