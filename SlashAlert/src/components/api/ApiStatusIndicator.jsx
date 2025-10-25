import React from 'react';
import { useApi } from '../../contexts/ApiContext';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const ApiStatusIndicator = ({ showFullStatus = false }) => {
  const { apiStatus, checkApiHealth } = useApi();

  if (!showFullStatus && apiStatus.isAvailable) {
    // Only show indicator when there are issues if showFullStatus is false
    return null;
  }

  const getStatusBadge = () => {
    if (apiStatus.isChecking) {
      return (
        <Badge variant="secondary" className="flex items-center gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Checking API...
        </Badge>
      );
    }

    if (apiStatus.isAvailable) {
      return (
        <Badge variant="default" className="flex items-center gap-2 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          API Connected
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-2">
        <AlertCircle className="h-3 w-3" />
        API Unavailable
      </Badge>
    );
  };

  if (showFullStatus) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {apiStatus.isAvailable ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            {getStatusBadge()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkApiHealth}
            disabled={apiStatus.isChecking}
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
        </div>
        
        {apiStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              API Error: {apiStatus.error}
            </AlertDescription>
          </Alert>
        )}
        
        {apiStatus.lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {apiStatus.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  // Minimal status for general UI
  if (!apiStatus.isAvailable) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>API is currently unavailable. Some features may not work.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkApiHealth}
            disabled={apiStatus.isChecking}
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

// Header component to show API status in navigation
export const HeaderApiStatus = () => {
  const { apiStatus } = useApi();

  return (
    <div className="flex items-center">
      {apiStatus.isAvailable ? (
        <div className="flex items-center gap-1 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}
    </div>
  );
};