import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="w-6 h-6 text-warning-amber" />
            Disclaimer and Terms of Use
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Please read the following information carefully before using SlashAlert.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none max-h-[60vh] overflow-y-auto pr-4 text-neutral-600">
          <h4>AI-Generated and Third-Party Data</h4>
          <p>
            The product prices, details, and comparisons displayed on SlashAlert are generated using Artificial Intelligence (AI) by scraping data from third-party retailer websites. This process is automated and subject to the complexities and frequent changes of e-commerce platforms.
          </p>
          
          <h4>Accuracy of Information</h4>
          <p>
            <strong>No Guarantee of Accuracy:</strong> While we strive for accuracy, we cannot guarantee that the prices and product information are always correct, complete, or up-to-date. Prices can change rapidly, and AI extraction may be subject to errors, misinterpretation of data, or temporary site-specific issues. The "final checkout price" may not include taxes, shipping fees, or other charges.
          </p>
          <p>
            <strong>Alerts are Informational:</strong> Price drop alerts are provided for informational purposes only. An alert does not constitute a guarantee that the price is available at the time you visit the retailer's website. Always verify the final price on the retailer's website before making a purchase.
          </p>

          <h4>Limitation of Liability</h4>
          <p>
            SlashAlert and its operators shall not be held liable for any financial loss, inconvenience, or damages arising from inaccuracies in the data provided, reliance on the information, or failure of the alert system. The service is provided on an "as-is" and "as-available" basis without any warranties, express or implied.
          </p>

          <h4>No Affiliation</h4>
          <p>
            SlashAlert is not affiliated with, endorsed by, or sponsored by any of the retailers shown on this site. All product names, logos, and brands are property of their respective owners.
          </p>
          
          <h4>Your Responsibility</h4>
          <p>
            By using this service, you acknowledge and agree that it is your sole responsibility to verify all information on the actual retailer's website before completing any purchase. You agree to use SlashAlert at your own risk.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}