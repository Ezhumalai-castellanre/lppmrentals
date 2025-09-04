// Enhanced Error Display Component
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { ChevronDown, ChevronUp, AlertCircle, X, RefreshCw, Info } from 'lucide-react';
import { AppError, ErrorCategory, ErrorSeverity } from '../../lib/error-handler';
import { cn } from '../../lib/utils';

// Error display props
interface ErrorDisplayProps {
  error?: AppError;
  errors?: AppError[];
  className?: string;
  showDetails?: boolean;
  collapsible?: boolean;
  onDismiss?: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  compact?: boolean;
}

// Single error display
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className,
  showDetails = false,
  onDismiss,
  onRetry,
  compact = false
}) => {
  if (!error) return null;

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ErrorSeverity.HIGH:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case ErrorSeverity.LOW:
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'border-red-200 bg-red-50 text-red-800';
      case ErrorSeverity.HIGH:
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case ErrorSeverity.MEDIUM:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case ErrorSeverity.LOW:
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getCategoryLabel = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'Validation Error';
      case ErrorCategory.NETWORK:
        return 'Network Error';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication Error';
      case ErrorCategory.AUTHORIZATION:
        return 'Authorization Error';
      case ErrorCategory.SERVER:
        return 'Server Error';
      case ErrorCategory.CLIENT:
        return 'Client Error';
      default:
        return 'Error';
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-md border', getSeverityColor(error.severity), className)}>
        {getSeverityIcon(error.severity)}
        <span className="text-sm font-medium">{error.userMessage || error.message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(error.id)}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className={cn('border-l-4', getSeverityColor(error.severity), className)}>
      <div className="flex items-start gap-3">
        {getSeverityIcon(error.severity)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="text-sm font-medium">
              {getCategoryLabel(error.category)}
            </AlertTitle>
            <Badge variant="outline" className="text-xs">
              {error.severity}
            </Badge>
            {error.field && (
              <Badge variant="secondary" className="text-xs">
                {error.field}
              </Badge>
            )}
          </div>
          <AlertDescription className="text-sm">
            {error.userMessage || error.message}
          </AlertDescription>
          {showDetails && error.details && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">
                Technical Details
              </summary>
              <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                {error.details}
              </pre>
            </details>
          )}
        </div>
        <div className="flex gap-1">
          {error.retryable && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(error.id)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(error.id)}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

// Multiple errors display
export const ErrorsDisplay: React.FC<ErrorDisplayProps> = ({
  errors = [],
  className,
  showDetails = false,
  collapsible = true,
  onDismiss,
  onRetry,
  compact = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (errors.length === 0) return null;

  const criticalErrors = errors.filter(e => e.severity === ErrorSeverity.CRITICAL);
  const highErrors = errors.filter(e => e.severity === ErrorSeverity.HIGH);
  const mediumErrors = errors.filter(e => e.severity === ErrorSeverity.MEDIUM);
  const lowErrors = errors.filter(e => e.severity === ErrorSeverity.LOW);

  const groupedErrors = [
    { severity: ErrorSeverity.CRITICAL, errors: criticalErrors },
    { severity: ErrorSeverity.HIGH, errors: highErrors },
    { severity: ErrorSeverity.MEDIUM, errors: mediumErrors },
    { severity: ErrorSeverity.LOW, errors: lowErrors }
  ].filter(group => group.errors.length > 0);

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {errors.slice(0, 3).map(error => (
          <ErrorDisplay
            key={error.id}
            error={error}
            compact
            onDismiss={onDismiss}
            onRetry={onRetry}
          />
        ))}
        {errors.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{errors.length - 3} more errors
          </div>
        )}
      </div>
    );
  }

  const content = (
    <div className="space-y-3">
      {groupedErrors.map(({ severity, errors: severityErrors }) => (
        <div key={severity} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium capitalize">{severity} Errors</h4>
            <Badge variant="outline" className="text-xs">
              {severityErrors.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {severityErrors.map(error => (
              <ErrorDisplay
                key={error.id}
                error={error}
                showDetails={showDetails}
                onDismiss={onDismiss}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (!collapsible || errors.length <= 2) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>View {errors.length} Error{errors.length !== 1 ? 's' : ''}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Field error display
interface FieldErrorDisplayProps {
  error?: string;
  errors?: string[];
  fieldName?: string;
  className?: string;
  showIcon?: boolean;
}

export const FieldErrorDisplay: React.FC<FieldErrorDisplayProps> = ({
  error,
  errors = [],
  fieldName,
  className,
  showIcon = true
}) => {
  const allErrors = error ? [error, ...errors] : errors;
  
  if (allErrors.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {allErrors.map((err, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-red-600">
          {showIcon && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
          <span>{err}</span>
        </div>
      ))}
    </div>
  );
};

// Error summary card
interface ErrorSummaryProps {
  errors: AppError[];
  className?: string;
  onDismiss?: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  onClearAll?: () => void;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  className,
  onDismiss,
  onRetry,
  onClearAll
}) => {
  if (errors.length === 0) return null;

  const errorCounts = errors.reduce((acc, error) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {} as Record<ErrorCategory, number>);

  const hasRetryableErrors = errors.some(e => e.retryable);

  return (
    <Card className={cn('border-red-200 bg-red-50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-red-800">
            {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
          </CardTitle>
          <div className="flex gap-2">
            {hasRetryableErrors && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => errors.filter(e => e.retryable).forEach(e => onRetry(e.id))}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry All
              </Button>
            )}
            {onClearAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Object.entries(errorCounts).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between text-sm">
              <span className="capitalize">{category.replace('_', ' ')}</span>
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
