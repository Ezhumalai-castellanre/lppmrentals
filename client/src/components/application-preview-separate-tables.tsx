import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Building, User, Users, Shield, FileText, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { dynamoDBSeparateTablesUtils } from '../lib/dynamodb-separate-tables-service';
import { useAuth } from '../hooks/use-auth';

interface ApplicationPreviewProps {
  onClose?: () => void;
}

export const ApplicationPreviewSeparateTables: React.FC<ApplicationPreviewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [applicantData, setApplicantData] = useState<any>(null);
  const [coApplicantData, setCoApplicantData] = useState<any>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  // New: arrays to support multi applicants
  const [coApplicants, setCoApplicants] = useState<any[]>([]);
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreviewData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get all data from separate tables
        const allData = await dynamoDBSeparateTablesUtils.getAllUserData();

        setApplicationData(allData.application);
        setApplicantData(allData.applicant);
        setCoApplicantData(allData.coApplicant);
        setGuarantorData(allData.guarantor);

        // Multi: fetch arrays by appid if available
        if (allData.application?.appid) {
          const [coApps, guarans] = await Promise.all([
            dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(allData.application.appid),
            dynamoDBSeparateTablesUtils.getGuarantorsByAppId(allData.application.appid),
          ]);
          setCoApplicants(coApps || []);
          setGuarantors(guarans || []);
        } else {
          setCoApplicants([]);
          setGuarantors([]);
        }
        
        console.log('📊 Application Preview Data Loaded:', {
          application: allData.application,
          applicant: allData.applicant,
          coApplicant: allData.coApplicant,
          guarantor: allData.guarantor,
          coApplicants,
          guarantors,
        });
      } catch (err) {
        console.error('❌ Error loading preview data:', err);
        setError('Failed to load application data');
      } finally {
        setLoading(false);
      }
    };

    loadPreviewData();
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">❌ {error}</div>
            <button 
              onClick={onClose}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Preview</h1>
          <p className="text-gray-600">Data from separate DynamoDB tables</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Information (app_nyc) */}
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-blue-900">
                <Building className="w-5 h-5 mr-2" />
                Application Information
                <Badge className="ml-auto bg-blue-100 text-blue-800">app_nyc</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationData ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Property Address:</span>
                      <p className="text-gray-900">{applicationData.application_info?.buildingAddress || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Apartment:</span>
                      <p className="text-gray-900">{applicationData.application_info?.apartmentNumber || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Monthly Rent:</span>
                      <p className="text-gray-900">${applicationData.application_info?.monthlyRent || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Move-in Date:</span>
                      <p className="text-gray-900">{applicationData.application_info?.moveInDate ? formatDate(applicationData.application_info.moveInDate) : 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(applicationData.status)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Last Updated:</span>
                      <p className="text-gray-900">{formatDate(applicationData.last_updated)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">No application data found</p>
              )}
            </CardContent>
          </Card>

          {/* Primary Applicant (applicant_nyc) */}
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-green-900">
                <User className="w-5 h-5 mr-2" />
                Primary Applicant
                <Badge className="ml-auto bg-green-100 text-green-800">applicant_nyc</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicantData ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{applicantData.applicant_info?.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{applicantData.applicant_info?.email || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <p className="text-gray-900">{applicantData.applicant_info?.phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(applicantData.status)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Occupants:</span>
                      <p className="text-gray-900">{applicantData.occupants?.length || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Last Updated:</span>
                      <p className="text-gray-900">{formatDate(applicantData.last_updated)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">No applicant data found</p>
              )}
            </CardContent>
          </Card>

          {/* Co-Applicants (supports multiple) */}
          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center text-purple-900">
                <Users className="w-5 h-5 mr-2" />
                Co-Applicants
                <Badge className="ml-auto bg-purple-100 text-purple-800">Co-Applicants</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coApplicants.length > 0 ? (
                <div className="space-y-4">
                  {coApplicants.map((co, idx) => (
                    <div key={idx} className="rounded border p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="text-gray-900">{co.coapplicant_info?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Email:</span>
                          <p className="text-gray-900">{co.coapplicant_info?.email || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-900">{co.coapplicant_info?.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Status:</span>
                          <div className="mt-1">{getStatusBadge(co.status)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Occupants:</span>
                          <p className="text-gray-900">{co.occupants?.length || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Last Updated:</span>
                          <p className="text-gray-900">{formatDate(co.last_updated)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : coApplicantData ? (
                // Backward compatibility: show single if arrays not populated
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{coApplicantData.coapplicant_info?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{coApplicantData.coapplicant_info?.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <p className="text-gray-900">{coApplicantData.coapplicant_info?.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(coApplicantData.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Occupants:</span>
                    <p className="text-gray-900">{coApplicantData.occupants?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <p className="text-gray-900">{formatDate(coApplicantData.last_updated)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No co-applicant data found</p>
              )}
            </CardContent>
          </Card>

          {/* Guarantors (supports multiple) */}
          <Card>
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center text-orange-900">
                <Shield className="w-5 h-5 mr-2" />
                Guarantors
                <Badge className="ml-auto bg-orange-100 text-orange-800">Guarantors_nyc</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guarantors.length > 0 ? (
                <div className="space-y-4">
                  {guarantors.map((g, idx) => (
                    <div key={idx} className="rounded border p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="text-gray-900">{g.guarantor_info?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Email:</span>
                          <p className="text-gray-900">{g.guarantor_info?.email || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-900">{g.guarantor_info?.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Status:</span>
                          <div className="mt-1">{getStatusBadge(g.status)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Occupants:</span>
                          <p className="text-gray-900">{g.occupants?.length || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Last Updated:</span>
                          <p className="text-gray-900">{formatDate(g.last_updated)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : guarantorData ? (
                // Backward compatibility: show single if arrays not populated
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{guarantorData.guarantor_info?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{guarantorData.guarantor_info?.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <p className="text-gray-900">{guarantorData.guarantor_info?.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(guarantorData.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Occupants:</span>
                    <p className="text-gray-900">{guarantorData.occupants?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <p className="text-gray-900">{formatDate(guarantorData.last_updated)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No guarantor data found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <FileText className="w-5 h-5 mr-2" />
              Application Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Application Info</div>
                <div className="text-2xl font-bold text-blue-600">{applicationData ? '✓' : '✗'}</div>
                <div className="text-blue-700">{applicationData ? 'Present' : 'Missing'}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Primary Applicant</div>
                <div className="text-2xl font-bold text-green-600">{applicantData ? '✓' : '✗'}</div>
                <div className="text-green-700">{applicantData ? 'Present' : 'Missing'}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">Co-Applicants</div>
                <div className="text-2xl font-bold text-purple-600">{(coApplicants?.length || 0) > 0 || coApplicantData ? '✓' : '✗'}</div>
                <div className="text-purple-700">{(coApplicants?.length || 0) > 0 || coApplicantData ? 'Present' : 'Missing'}</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-900">Guarantors</div>
                <div className="text-2xl font-bold text-orange-600">{(guarantors?.length || 0) > 0 || guarantorData ? '✓' : '✗'}</div>
                <div className="text-orange-700">{(guarantors?.length || 0) > 0 || guarantorData ? 'Present' : 'Missing'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {onClose && (
          <div className="mt-8 text-center">
            <button 
              onClick={onClose}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
