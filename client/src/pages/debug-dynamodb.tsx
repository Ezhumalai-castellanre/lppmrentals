import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';
import { dynamoDBSeparateTablesUtils } from '../lib/dynamodb-separate-tables-service';

export default function DebugDynamoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dynamoDBSeparateTablesUtils.getAllUserData();
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">DynamoDB Debug (Current User)</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify({
              userId: (user as any)?.id,
              role: (user as any)?.role,
              zoneinfo: (user as any)?.zoneinfo,
              email: (user as any)?.email,
            }, null, 2)}</pre>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent>
              <div className="py-6">Loading...</div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-700">{error}</div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Application (app_nyc)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.application || null, null, 2)}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Applicant (applicant_nyc)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.applicant || null, null, 2)}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Co-Applicant (Co-Applicants)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.coApplicant || null, null, 2)}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guarantor (Guarantors_nyc)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.guarantor || null, null, 2)}</pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}


