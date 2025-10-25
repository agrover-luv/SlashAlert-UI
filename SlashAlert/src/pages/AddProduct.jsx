
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, UploadCloud, Mic, MicOff, Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

import ProductForm from "../components/addproduct/ProductForm";
import ImportReceiptModal from "../components/addproduct/ImportReceiptModal";

export default function AddProduct() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [productNameFromVoice, setProductNameFromVoice] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const checkUserLimits = async () => {
      setIsLoadingUserData(true);
      try {
        const user = await User.me();
        if (user && user.subscription_plan !== 'premium') {
          const userProducts = await Product.filter({ 
            is_active: true, 
            deleted: false 
          });
          if (userProducts.length >= 5) {
            setIsLimitReached(true);
          }
        }
      } catch (error) {
        console.error("Error checking user limits:", error);
      }
      setIsLoadingUserData(false);
    };
    checkUserLimits();
  }, []);

  const handleSubmit = async (productData) => {
    setIsSubmitting(true);
    try {
      await Product.create(productData);
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 2000);
    } catch (error) {
      console.error("Error adding product:", error);
    }
    setIsSubmitting(false);
  };

  const handleImportSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 2000);
  }

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Sorry, your browser does not support voice recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceError("");
    setProductNameFromVoice("");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setProductNameFromVoice(transcript);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setVoiceError(`Error occurred in recognition: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-light-blue/30 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-success-green to-success-green/80 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Product Added Successfully!</h2>
          <p className="text-neutral-600 mb-4">We'll start tracking the price for you.</p>
          <p className="text-sm text-neutral-500">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-light-blue/30 p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Add New Product</h1>
              <p className="text-neutral-600 mt-1">Start tracking prices for your favorite products</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleListen}
              className={`bg-white/80 hover:bg-white transition-all ${isListening ? 'text-danger-red animate-pulse' : 'text-primary-blue'}`}
              disabled={isLimitReached || isLoadingUserData}
            >
              {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {isListening ? 'Listening...' : 'Add with Voice'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white/80 hover:bg-white"
              disabled={isLimitReached || isLoadingUserData}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Import from Receipt
            </Button>
          </div>
        </motion.div>

        {voiceError && <p className="text-danger-red text-sm mb-4">{voiceError}</p>}

        {isLoadingUserData ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
          </div>
        ) : isLimitReached ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant="destructive" className="mb-8 bg-red-50/80 border-red-200 shadow-md">
              <Zap className="h-4 w-4" />
              <AlertTitle className="font-bold text-lg">Active Product Limit Reached</AlertTitle>
              <AlertDescription>
                You have reached the limit of 5 active products for the free plan. To track more products, please upgrade to Premium. You can also disable tracking on an existing product from your dashboard.
                <Button asChild variant="link" className="p-0 h-auto ml-2 text-red-700 font-bold hover:text-red-800">
                  <Link to={createPageUrl("Account")}>Upgrade to Premium</Link>
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <ProductForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            initialProductName={productNameFromVoice}
            isLimitReached={isLimitReached}
          />
        )}
      </div>
      <ImportReceiptModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
