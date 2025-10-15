import React from 'react';
import DraftCards from '../components/draft-cards';

export default function DraftsPage() {
  return (
    <div className="space-y-8">
      <DraftCards />

      <PayscoreEmbed />
    </div>
  );
}

function PayscoreEmbed() {
  const widgetRef = React.useRef<any>(null);
  const [logText, setLogText] = React.useState<string>("");

  const appendLog = React.useCallback((msg: string) => {
    setLogText((prev) => `${prev}${msg}\n`);
  }, []);

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

    // Dynamically import the Payscore SDK from CDN at runtime to avoid bundler resolution
    const payscoreModule: any = await import(
      /* @vite-ignore */ 'https://cdn.skypack.dev/@payscore/web-widget-sdk'
    );
    const { IncomeVerificationWidget } = payscoreModule;

    // Use the provided values
    const WIDGET_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzZTVhZDA5OS1iMmEwLTQ3ZTYtYmRiNi0xYzk0NDRjMTJiNDciLCJzY3AiOiJzY3JlZW5pbmciLCJhdWQiOm51bGwsImlhdCI6MTc2MDM5NjE0NCwiZXhwIjoxNzYxNjA1NzQ0LCJqdGkiOiIwMjQzMmRjOC1lZWUyLTRjMmItYTI3Yy0yNGU4MmM2NGRkOTIifQ.OVFU1cVz9pgkoX26ncAfu_U2G9D5dCBYzf-zbRqCLCg';
    const SCREENING_ID = '3e5ad099-b2a0-47e6-bdb6-1c9444c12b47';

    widgetRef.current = new IncomeVerificationWidget({
      widgetToken: WIDGET_TOKEN,
      screeningId: SCREENING_ID,
      environment: 'staging',
      onEvent,
    });

    widgetRef.current.load();
  }, [onEvent, appendLog]);

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
    <div className="p-4 border rounded-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold">Payscore - Verify Income</div>
          <div className="text-sm text-muted-foreground">Environment: staging</div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadWidget} className="px-3 py-2 rounded-md bg-blue-600 text-white border border-blue-600">
            Verify Income
          </button>
          <button onClick={unmountWidget} className="px-3 py-2 rounded-md bg-gray-200 text-gray-900 border border-gray-300">
            Unmount
          </button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2 flex gap-2 items-center">
        <div>Screening ID:</div>
        <code className="bg-slate-100 px-1.5 py-0.5 rounded">3e5ad099-b2a0-47e6-bdb6-1c9444c12b47</code>
      </div>

      <pre className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{logText}</pre>
    </div>
  );
}
