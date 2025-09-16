import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar, MapPin, DollarSign, User, Building, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: number;
  applicantId: string;
  applicationDate: string;
  buildingAddress: string;
  apartmentNumber: string;
  moveInDate: string;
  monthlyRent: number;
  apartmentType: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  submittedAt?: string;
}



const fetchApplications = async (applicantId: string): Promise<Application[]> => {
  const response = await fetch(`/api/applications/user/${applicantId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  return response.json();
};

const ApplicationCard = ({ application }: { application: Application }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {application.buildingAddress}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Apartment {application.apartmentNumber}
            </p>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{application.applicantName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{application.apartmentType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">${application.monthlyRent}/month</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Move-in: {formatDate(application.moveInDate)}</span>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>Submitted: {formatDate(application.applicationDate)}</span>
            </div>
            {application.submittedAt && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Finalized: {formatDate(application.submittedAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['applications', user?.applicantId],
    queryFn: () => fetchApplications(user?.applicantId || ''),
    enabled: !!user?.applicantId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-red-600">Error loading applications. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-blue-300/50 p-8" style={{background: 'rgb(49,156,55)'}}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute inset-0" style={{backgroundImage: 'url(https://rentobjectsphotos.s3.us-east-1.amazonaws.com/mobile-app-illustration-svg-png-download-7758932.webp)', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
            </div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white tracking-tight">My Applications</h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">Manage and track all your rental applications in one place</p>
              </div>
              <div className="hidden lg:block">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-48 h-32 text-white/20">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {applications && applications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any rental applications yet.
              </p>
              <Button asChild>
                <a href="/application">Start New Application</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 