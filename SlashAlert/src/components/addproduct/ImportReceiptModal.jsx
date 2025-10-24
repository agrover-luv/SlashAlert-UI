
import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, AlertCircle, Inbox, CheckCircle } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Product } from '@/api/entities';
import { Retailer } from '@/api/entities';
import ExtractedProductItem from './ExtractedProductItem';
import { AnimatePresence, motion } from "framer-motion";

const ocrSchema = {
  type: "object",
  properties: {
    products: {
      type: "array",
      description: "A list of products found on the receipt.",
      items: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "The name of the product."
          },
          price: {
            type: "number",
            description: "The price of the product."
          }
        },
        required: ["product_name", "price"]
      }
    },
    purchase_date: {
      type: "string",
      format: "date",
      description: "The date of purchase from the receipt, in YYYY-MM-DD format."
    }
  }
};

export default function ImportReceiptModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedProducts, setExtractedProducts] = useState([]);
  const [view, setView] = useState('upload'); // 'upload', 'review', 'success'
  const [retailers, setRetailers] = useState([]);

  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const retailerData = await Retailer.list();
        setRetailers(retailerData);
      } catch (e) {
        console.error("Failed to fetch retailers:", e);
      }
    };
    if (isOpen) {
      fetchRetailers();
    }
  }, [isOpen]);
  
  // Removed useDropzone and onDrop.
  // Changed file selection to a standard input change handler.
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleProcessReceipt = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setExtractedProducts([]);

    try {
      const { file_url } = await UploadFile({ file });
      const result = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: ocrSchema,
      });

      if (result.status === 'success' && result.output.products) {
        const receiptDate = result.output.purchase_date || new Date().toISOString().split('T')[0];
        const productsWithIds = result.output.products.map(p => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9), // temp id for list key
          name: p.product_name,
          current_price: p.price,
          original_price: p.price,
          purchased_date: receiptDate,
          url: '',
          retailer: 'other', // Default to 'other' or a sensible default
          category: 'other',
          is_active: true,
          check_frequency: 'daily',
          include: true
        }));
        setExtractedProducts(productsWithIds);
        setView('review');
      } else {
        setError(result.details || "Could not extract product data from the receipt. Please try another image.");
      }
    } catch (e) {
      setError("An error occurred during processing. Please try again.");
      console.error(e);
    }

    setIsProcessing(false);
  };
  
  const handleProductChange = (id, field, value) => {
    setExtractedProducts(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const handleAddSelectedProducts = async () => {
    const productsToCreate = extractedProducts
      .filter(p => p.include && p.name && p.current_price > 0)
      .map(({ id, include, product_name, ...rest }) => rest);

    if (productsToCreate.length === 0) {
      setError("No products selected or configured for import.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await Product.bulkCreate(productsToCreate);
      setView('success');
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 2000);
    } catch (e) {
      setError("Failed to import products. Please try again.");
      console.error(e);
    }
    setIsProcessing(false);
  };

  const handleClose = () => {
    setFile(null);
    setExtractedProducts([]);
    setError(null);
    setView('upload');
    onClose();
  };
  
  const renderContent = () => {
    switch (view) {
      case 'upload':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DialogDescription className="mb-6">
              Upload a clear photo of a receipt, and we'll use AI to extract the products for you.
            </DialogDescription>
            <div
              className="p-10 border-2 border-dashed rounded-lg text-center transition-colors border-neutral-300" // Removed dynamic classes related to drag state
            >
              <div className="flex flex-col items-center justify-center">
                <Inbox className="w-12 h-12 text-neutral-400 mb-4" />
                <p className="text-neutral-600 mb-4">Select a receipt image to upload</p> {/* Updated text */}
                <Button asChild variant="outline" className="bg-white hover:bg-neutral-50">
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </Button>
                <input
                  id="receipt-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/jpg"
                />
              </div>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-neutral-100 rounded-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                <span className="text-neutral-800 font-medium">{file.name}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-danger-red">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleProcessReceipt} disabled={!file || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process Receipt
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        );
      case 'review':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DialogDescription className="mb-4">
              Review the extracted products. Uncheck any you don't want to import, and fill in any missing details.
            </DialogDescription>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-2 -mr-2">
              <AnimatePresence>
                {extractedProducts.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ExtractedProductItem
                      product={product}
                      onChange={handleProductChange}
                      retailers={retailers}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
             {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-danger-red">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={() => setView('upload')}>Back</Button>
              <Button onClick={handleAddSelectedProducts} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Add ${extractedProducts.filter(p=>p.include).length} Products`
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        );
      case 'success':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-success-green mx-auto mb-6" />
            <h3 className="text-xl font-bold text-neutral-900">Import Successful!</h3>
            <p className="text-neutral-600 mt-2">Your products have been added to the dashboard.</p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-neutral-900">
            Import Products from Receipt
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
