
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const categories = [
  { value: "electronics", label: "Electronics" }, { value: "clothing", label: "Clothing" },
  { value: "home", label: "Home & Garden" }, { value: "books", label: "Books" },
  { value: "sports", label: "Sports" }, { value: "beauty", label: "Beauty" },
  { value: "toys", label: "Toys" }, { value: "automotive", label: "Automotive" },
  { value: "other", label: "Other" }
];

export default function ExtractedProductItem({ product, onChange, retailers }) {
  return (
    <Card className="bg-white/80 border border-neutral-200 p-4 transition-all hover:border-primary-blue/50">
      <CardContent className="p-0">
        <div className="flex items-start gap-4">
          <Checkbox
            id={`include-${product.id}`}
            checked={product.include}
            onCheckedChange={(checked) => onChange(product.id, 'include', checked)}
            className="mt-1"
          />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor={`name-${product.id}`} className="text-xs font-medium text-neutral-600">Product Name</Label>
              <Input
                id={`name-${product.id}`}
                value={product.name}
                onChange={(e) => onChange(product.id, 'name', e.target.value)}
                placeholder="Product Name"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`price-${product.id}`} className="text-xs font-medium text-neutral-600">Price</Label>
              <Input
                id={`price-${product.id}`}
                type="number"
                value={product.current_price}
                onChange={(e) => {
                  const price = e.target.value;
                  onChange(product.id, 'current_price', price);
                  onChange(product.id, 'original_price', price);
                }}
                placeholder="0.00"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`pdate-${product.id}`} className="text-xs font-medium text-neutral-600">Purchased/Potential Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {product.purchased_date ? format(new Date(product.purchased_date + 'T12:00:00'), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={product.purchased_date ? new Date(product.purchased_date + 'T12:00:00') : null}
                    onSelect={(date) => {
                      if (date) {
                        // Format date to avoid timezone issues
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;
                        onChange(product.id, 'purchased_date', dateString);
                      } else {
                        onChange(product.id, 'purchased_date', '');
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <Label htmlFor={`url-${product.id}`} className="text-xs font-medium text-neutral-600">Product URL (Optional)</Label>
              <Input
                id={`url-${product.id}`}
                value={product.url}
                onChange={(e) => onChange(product.id, 'url', e.target.value)}
                placeholder="https://example.com/product"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`retailer-${product.id}`} className="text-xs font-medium text-neutral-600">Retailer</Label>
              <Select value={product.retailer} onValueChange={(value) => onChange(product.id, 'retailer', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((retailer) => (
                    <SelectItem key={retailer.name} value={retailer.name}>{retailer.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`category-${product.id}`} className="text-xs font-medium text-neutral-600">Category</Label>
              <Select value={product.category} onValueChange={(value) => onChange(product.id, 'category', value)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
