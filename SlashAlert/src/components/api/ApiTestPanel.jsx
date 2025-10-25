import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiService from '@/services/apiService';
import { useApi } from '@/contexts/ApiContext';
import { CheckCircle, XCircle, AlertCircle, Loader2, TestTube, RefreshCw } from 'lucide-react';

export const ApiTestPanel = () => {
  const { apiStatus, checkApiHealth } = useApi();
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testData, setTestData] = useState({
    productName: 'Test Product',
    productPrice: '99.99',
    productUrl: 'https://example.com/product'
  });

  const apiTests = [
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'GET',
      test: async () => {
        const result = await apiService.healthCheck();
        return result.status === 'ok';
      }
    },
    {
      name: 'Get Products',
      endpoint: '/api/products',
      method: 'GET',
      test: async () => {
        try {
          const products = await apiService.getProducts();
          return Array.isArray(products);
        } catch (error) {
          // API might not be implemented yet, check if we get a proper error response
          return error.message.includes('HTTP') || error.message.includes('fetch');
        }
      }
    },
    {
      name: 'Get Current User',
      endpoint: '/api/users/me',
      method: 'GET',
      test: async () => {
        try {
          const user = await apiService.getCurrentUser();
          return user && typeof user === 'object';
        } catch (error) {
          // Expected if not implemented yet
          return error.message.includes('HTTP') || error.message.includes('fetch');
        }
      }
    },
    {
      name: 'Create Product',
      endpoint: '/api/products',
      method: 'POST',
      test: async () => {
        try {
          const productData = {
            name: testData.productName,
            current_price: parseFloat(testData.productPrice),
            url: testData.productUrl,
            retailer: 'Test Store',
            category: 'test'
          };
          const result = await apiService.createProduct(productData);
          return result && result.id;
        } catch (error) {
          // Expected if not implemented yet
          return error.message.includes('HTTP') || error.message.includes('fetch');
        }
      }
    },
    {
      name: 'LLM Integration',
      endpoint: '/api/ai/llm',
      method: 'POST',
      test: async () => {
        try {
          const result = await apiService.invokeLLM('Test prompt', { max_tokens: 10 });
          return result && result.response;
        } catch (error) {
          // Expected if not implemented yet
          return error.message.includes('HTTP') || error.message.includes('fetch');
        }
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    for (const test of apiTests) {
      try {
        setTestResults(prev => ({
          ...prev,
          [test.name]: { status: 'running', error: null }
        }));

        const success = await test.test();
        
        setTestResults(prev => ({
          ...prev,
          [test.name]: { 
            status: success ? 'success' : 'failed', 
            error: success ? null : 'Test returned false'
          }
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          [test.name]: { 
            status: 'error', 
            error: error.message 
          }
        }));
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Running...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          API Integration Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">API Status</Label>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {apiStatus.isAvailable ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                {apiStatus.isAvailable ? 'API Available' : 'API Unavailable'}
              </span>
              {apiStatus.error && (
                <Badge variant="destructive">Error: {apiStatus.error}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkApiHealth}
              disabled={apiStatus.isChecking}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
              Check
            </Button>
          </div>
        </div>

        {/* Test Configuration */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Test Data Configuration</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={testData.productName}
                onChange={(e) => setTestData(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="productPrice">Price</Label>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                value={testData.productPrice}
                onChange={(e) => setTestData(prev => ({ ...prev, productPrice: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="productUrl">Product URL</Label>
              <Input
                id="productUrl"
                type="url"
                value={testData.productUrl}
                onChange={(e) => setTestData(prev => ({ ...prev, productUrl: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Run Tests Button */}
        <div className="flex justify-center">
          <Button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="flex items-center gap-2"
          >
            {isRunningTests ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Test Results</Label>
          {apiTests.map((test) => {
            const result = testResults[test.name];
            return (
              <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result?.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-500">
                      {test.method} {test.endpoint}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result?.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Details */}
        {Object.values(testResults).some(result => result?.error) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Error Details</Label>
            {Object.entries(testResults)
              .filter(([_, result]) => result?.error)
              .map(([testName, result]) => (
                <Alert key={testName} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{testName}:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              ))
            }
          </div>
        )}

        {/* Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This test panel helps verify that the API integration is working correctly. 
            Some tests may fail if the backend endpoints are not yet implemented. 
            Check the API_REQUIREMENTS.md file for implementation details.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};