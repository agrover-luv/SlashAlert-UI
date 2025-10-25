import React from 'react';
import { ApiTestPanel } from '@/components/api/ApiTestPanel';
import { ApiStatusIndicator } from '@/components/api/ApiStatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Settings } from 'lucide-react';

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            API Development & Testing
          </h1>
          <p className="text-gray-600">
            Test and monitor the SlashAlert API integration
          </p>
        </div>

        {/* API Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Base URL</label>
                <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5081'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">API Prefix</label>
                <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                  {import.meta.env.VITE_API_PREFIX || '/api'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Environment</label>
                <div className="flex items-center gap-2">
                  <Badge variant={import.meta.env.VITE_NODE_ENV === 'development' ? 'secondary' : 'default'}>
                    {import.meta.env.VITE_NODE_ENV || 'development'}
                  </Badge>
                  {import.meta.env.VITE_DEBUG_API === 'true' && (
                    <Badge variant="outline">Debug Mode</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed API Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              API Status Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApiStatusIndicator showFullStatus={true} />
          </CardContent>
        </Card>

        {/* API Test Panel */}
        <ApiTestPanel />

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Development Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">API Documentation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API_REQUIREMENTS.md - Backend implementation guide</li>
                  <li>• src/services/apiService.js - API client implementation</li>
                  <li>• src/api/entities.js - Entity API wrappers</li>
                  <li>• src/contexts/ApiContext.jsx - API status management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Environment Variables</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• VITE_API_BASE_URL - API server URL</li>
                  <li>• VITE_API_PREFIX - API route prefix</li>
                  <li>• VITE_GOOGLE_CLIENT_ID - Google OAuth client</li>
                  <li>• VITE_DEBUG_API - Enable API debugging</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}