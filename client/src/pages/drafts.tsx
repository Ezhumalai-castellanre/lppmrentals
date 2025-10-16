import { dynamoDBSeparateTablesUtils } from "../lib/dynamodb-separate-tables-service";
import { IncomeVerificationWidget } from '@payscore/web-widget-sdk';
import React from 'react';
import DraftCards from '../components/draft-cards';

export default function DraftsPage() {
  return (
    <div className="space-y-8">
      <DraftCards />

      {/* <PayscoreEmbed /> */}
    </div>
  );
}

function PayscoreEmbed() {
  const widgetRef = React.useRef<any>(null);
  const [logText, setLogText] = React.useState<string>("");
  const [screeningId, setScreeningId] = React.useState<string>("");
  const [widgetToken, setWidgetToken] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");

  const appendLog = React.useCallback((msg: string) => {
    setLogText((prev) => `${prev}${msg}\n`);
  }, []);

  // Load latest Payscore tokens on page load
  const loadTokens = React.useCallback(async (): Promise<{ widgetToken: string; screeningId: string; status?: string }> => {
    try {
      let WIDGET_TOKEN: string = '';
      let SCREENING_ID: string = '';
      let STATUS: string | undefined = '';
      const tokens = await dynamoDBSeparateTablesUtils.getLatestPayscoreTokensForCurrentUser();
      if (tokens) {
        WIDGET_TOKEN = tokens.widget_token || WIDGET_TOKEN;
        SCREENING_ID = tokens.screening_id || SCREENING_ID;
        STATUS = tokens.status || STATUS;
      }
      if (!SCREENING_ID) {
        // Try to derive from widget token if it's a JWT with payload
        try {
          const parts = (WIDGET_TOKEN || '').split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (typeof payload?.screening_id === 'string') SCREENING_ID = payload.screening_id;
            if (!SCREENING_ID && typeof payload?.screeningId === 'string') SCREENING_ID = payload.screeningId;
          }
        } catch {}
      }
      setWidgetToken(WIDGET_TOKEN);
      setScreeningId(SCREENING_ID);
      setStatus(STATUS || '');
      return { widgetToken: WIDGET_TOKEN, screeningId: SCREENING_ID, status: STATUS };
    } catch (e) {
      console.warn('⚠️ Could not load payscore tokens on mount:', e);
      return { widgetToken: '', screeningId: '', status: '' };
    }
  }, []);

  React.useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const onEvent = React.useCallback((event: any) => {
    const type = event?.type;
    switch (type) {
      case 'IncomeVerificationLoaded':
        appendLog('Widget loaded');
        break;
      case 'IncomeVerificationStarted':
        appendLog('Verification started');
        break;
      case 'IncomeVerificationCompleted':
        appendLog('Verification completed');
        if (widgetRef.current) {
          widgetRef.current.unmount();
          widgetRef.current = null;
        }
        break;
      default:
        appendLog(`Event: ${type ?? 'unknown'}`);
    }
  }, [appendLog]);

  const loadWidget = React.useCallback(async () => {
    if (widgetRef.current) {
      widgetRef.current.unmount();
      widgetRef.current = null;
    }

    appendLog('Loading widget...');

    // SDK is imported from the bundle (CSP-friendly)

    // Ensure we have tokens; load if missing
    let effectiveWidgetToken = widgetToken;
    let effectiveScreeningId = screeningId;
    if (!effectiveWidgetToken || !effectiveScreeningId) {
      const fetched = await loadTokens();
      effectiveWidgetToken = fetched.widgetToken;
      effectiveScreeningId = fetched.screeningId;
    }
    if (!effectiveWidgetToken || !effectiveScreeningId) {
      appendLog('❌ Missing Payscore tokens. Ensure payscore submission created a record.');
      return;
    }

    widgetRef.current = new IncomeVerificationWidget({
      widgetToken: effectiveWidgetToken,
      screeningId: effectiveScreeningId,
      environment: 'staging',
      onEvent,
    });
    console.log(effectiveScreeningId);
    

    widgetRef.current.load();
  }, [onEvent, appendLog, loadTokens, widgetToken, screeningId]);

  const unmountWidget = React.useCallback(() => {
    if (widgetRef.current) {
      widgetRef.current.unmount();
      widgetRef.current = null;
      appendLog('Widget unmounted');
    }
  }, [appendLog]);

  React.useEffect(() => {
    return () => {
      if (widgetRef.current) {
        widgetRef.current.unmount();
        widgetRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Income Verification</h3>
          <p className="text-sm text-gray-500 mt-1">Complete your income verification process</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadWidget} 
            className="px-4 py-2 rounded-md bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Verify Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Screening ID</label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <code className="text-sm text-gray-800 font-mono">
              {screeningId || 'Not available'}
            </code>
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <span className={`text-sm font-medium ${
              status === 'completed' ? 'text-green-600' : 
              status === 'pending' ? 'text-yellow-600' : 
              status === 'failed' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {status || 'Not available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
