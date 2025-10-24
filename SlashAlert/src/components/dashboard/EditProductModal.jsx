import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from '../addproduct/ProductForm';

export default function EditProductModal({ isOpen, onClose, product, onSave }) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white/90 backdrop-blur-sm p-0 max-h-[90vh] overflow-y-auto">
        <ProductForm
          productToEdit={product}
          onSubmit={onSave}
          isSubmitting={false} // Loading state managed by dashboard
        />
      </DialogContent>
    </Dialog>
  );
}