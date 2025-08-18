import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, Upload, FileText, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { OptimizedUploadService } from '../lib/optimized-upload-service';

interface UploadPerformanceMonitorProps {
  isUploading: boolean;
  progress: any;
  currentFile: string | null;
  uploadedFiles: any[];
  averageUploadTime: number;
  totalUploadedSize: number;
  uploadSpeed: number;
}

export const UploadPerformanceMonitor: React.FC<UploadPerformanceMonitorProps> = ({
  isUploading,
  progress,
  currentFile,
  uploadedFiles,
  averageUploadTime,
  totalUploadedSize,
  uploadSpeed
}) => {
  // Calculate performance metrics
  const totalFiles = uploadedFiles.length;
  const successfulUploads = uploadedFiles.filter(f => f.success).length;
  const failedUploads = totalFiles - successfulUploads;
  const successRate = totalFiles > 0 ? (successfulUploads / totalFiles) * 100 : 0;

  // Performance analysis
  const getPerformanceGrade = (avgTime: number) => {
    if (avgTime < 2000) return { grade: 'A', color: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (avgTime < 5000) return { grade: 'B', color: 'bg-blue-100 text-blue-800', label: 'Good' };
    if (avgTime < 10000) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800', label: 'Fair' };
    return { grade: 'D', color: 'bg-red-100 text-red-800', label: 'Poor' };
  };

  const performanceGrade = getPerformanceGrade(averageUploadTime);

  // Bottleneck analysis
  const getBottleneckAnalysis = () => {
    if (uploadedFiles.length === 0) return 'No uploads yet';
    
    const avgParseTime = uploadedFiles.reduce((sum, f) => sum + (f.performance?.parseTime || 0), 0) / uploadedFiles.length;
    const avgUploadTime = uploadedFiles.reduce((sum, f) => sum + (f.performance?.uploadTime || 0), 0) / uploadedFiles.length;
    
    if (avgParseTime > avgUploadTime * 0.5) {
      return 'Base64 conversion is slow - consider chunked uploads';
    } else if (avgUploadTime > 10000) {
      return 'Network upload is slow - check connection and file size';
    } else {
      return 'Performance is good across all metrics';
    }
  };

  const bottleneckAnalysis = getBottleneckAnalysis();

  return (
    <div className="space-y-4">
      {/* Current Upload Status */}
      {isUploading && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 animate-pulse" />
              Currently Uploading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File:</span>
                <span className="font-medium">{currentFile}</span>
              </div>
              
              {progress && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Speed:</span>
                      <span className="ml-2 font-medium">
                        {OptimizedUploadService.formatSpeed(progress.speed)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ETA:</span>
                      <span className="ml-2 font-medium">
                        {progress.estimatedTime > 0 ? `${Math.round(progress.estimatedTime)}s` : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successfulUploads}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedUploads}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Performance Grade */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance Grade:</span>
              <Badge className={performanceGrade.color}>
                {performanceGrade.grade} - {performanceGrade.label}
              </Badge>
            </div>

            {/* Average Upload Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Upload Time:</span>
              <span className="font-medium">
                {averageUploadTime > 0 ? `${averageUploadTime.toFixed(0)}ms` : 'N/A'}
              </span>
            </div>

            {/* Current Upload Speed */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Speed:</span>
              <span className="font-medium">
                {uploadSpeed > 0 ? OptimizedUploadService.formatSpeed(uploadSpeed) : 'N/A'}
              </span>
            </div>

            {/* Total Uploaded Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Uploaded:</span>
              <span className="font-medium">
                {OptimizedUploadService.formatFileSize(totalUploadedSize)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              {bottleneckAnalysis}
            </div>
            
            {/* Recommendations */}
            {bottleneckAnalysis.includes('slow') && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Recommendations:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use smaller file sizes when possible</li>
                  <li>• Ensure stable internet connection</li>
                  <li>• Consider chunked uploads for large files</li>
                  <li>• Check server response times</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadedFiles.slice(-5).reverse().map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {file.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{file.url?.split('/').pop() || 'Unknown file'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.performance?.totalTime ? `${file.performance.totalTime}ms` : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
