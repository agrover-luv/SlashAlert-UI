import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PriceComparisonTable({ results, onSelect }) {
  if (!results || results.length === 0) {
    return null;
  }

  const sortedResults = [...results].sort((a, b) => a.price - b.price);
  const bestPrice = sortedResults[0]?.price;

  return (
    <Card className="bg-gradient-to-r from-light-blue/20 to-primary-blue/10 border-primary-blue/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-blue" />
          <h3 className="text-lg font-semibold text-neutral-900">Price Scout Results</h3>
        </div>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Retailer</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedResults.map((result, index) => (
                <TableRow key={index} className={result.price === bestPrice ? 'bg-success-green/10' : ''}>
                    <TableCell className="font-medium capitalize">
                    {result.retailer}
                    {result.price === bestPrice && (
                        <Badge variant="secondary" className="ml-2 bg-success-green text-white animate-pulse">Best Price</Badge>
                    )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">${result.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="bg-white/80"
                        >
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                        </a>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onSelect(result)}
                            className="bg-primary-blue hover:bg-primary-blue/90"
                        >
                        <Check className="w-3 h-3 mr-1" />
                        Use
                        </Button>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}