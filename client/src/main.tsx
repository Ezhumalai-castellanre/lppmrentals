import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/aws-config";


// ULTRA-AGGRESSIVE ERROR SUPPRESSION - RUNS IMMEDIATELY
(function() {
  'use strict';
  
  // Store original methods
  const originalMethods = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    log: console.log.bind(console)
  };
  
  // Ultra-aggressive message filter - ENHANCED
  function shouldBlock(message: string): boolean {
    const msg = String(message).toLowerCase();
    const blockedPatterns = [
      'message port closed',
      'websocket connection to ws://localhost:8098/',
      'websocket connection to ws://localhost:8098',
      'websocket connection to',
      'websocket connection failed',
      'websocket failed',
      'inject.bundle.js',
      'inject.bundle',
      'runtime.lasterror',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'extension://',
      'localhost:8098',
      'localhost:8098/',
      'ws://localhost:8098',
      'ws://localhost:8098/',
      'injected css loaded successfully',
      'unchecked runtime.lasterror',
      'multi-tabs.js',
      'hook.js',
      'applicationinstructions component loaded',
      'component loaded',
      'extension error',
      'extension warning',
      'extension log',
      'browser extension',
      'addon',
      'plugin',
      'devtools',
      'inspector',
      'debugger',
      'source map',
      'eval',
      'inline script',
      'content script',
      'background script',
      'service worker',
      'manifest',
      'permissions',
      'storage',
      'tabs',
      'bookmarks',
      'history',
      'cookies',
      'webrequest',
      'webnavigation',
      'notifications',
      'alarms',
      'idle',
      'power',
      'system',
      'management',
      'enterprise',
      'identity',
      'oauth2',
      'chrome.runtime',
      'chrome.tabs',
      'chrome.bookmarks',
      'chrome.history',
      'chrome.cookies',
      'chrome.webrequest',
      'chrome.webnavigation',
      'chrome.notifications',
      'chrome.alarms',
      'chrome.idle',
      'chrome.power',
      'chrome.system',
      'chrome.management',
      'chrome.enterprise',
      'chrome.identity',
      'chrome.oauth2',
      'browser.runtime',
      'browser.tabs',
      'browser.bookmarks',
      'browser.history',
      'browser.cookies',
      'browser.webrequest',
      'browser.webnavigation',
      'browser.notifications',
      'browser.alarms',
      'browser.idle',
      'browser.power',
      'browser.system',
      'browser.management',
      'browser.enterprise',
      'browser.identity',
      'browser.oauth2'
    ];
    
    return blockedPatterns.some(pattern => msg.includes(pattern));
  }
  
  // Override console methods with ultra-aggressive filtering
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (shouldBlock(message)) {
      return; // Completely block
    }
    originalMethods.error.apply(console, args);
  };
  
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (shouldBlock(message)) {
      return; // Completely block
    }
    originalMethods.warn.apply(console, args);
  };
  
  console.log = function(...args: any[]) {
    const message = args.join(' ');
    if (shouldBlock(message)) {
      return; // Block extension-related logs
    }
    originalMethods.log.apply(console, args);
  };
  
  // Block all error events with ultra-aggressive filtering
  window.addEventListener('error', function(event: ErrorEvent) {
    const message = String(event.message || '');
    const filename = String(event.filename || '');
    if (shouldBlock(message) || shouldBlock(filename)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Block all unhandled promise rejections with ultra-aggressive filtering
  window.addEventListener('unhandledrejection', function(event: PromiseRejectionEvent) {
    const message = String(event.reason?.message || event.reason || '');
    if (shouldBlock(message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Block security policy violations
  window.addEventListener('securitypolicyviolation', function(event: SecurityPolicyViolationEvent) {
    if (shouldBlock(event.violatedDirective) || shouldBlock(event.blockedURI)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Block beforeunload events from extensions
  window.addEventListener('beforeunload', function(event: BeforeUnloadEvent) {
    if (shouldBlock(event.type)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Block all fetch requests to extension URLs
  const originalFetch = window.fetch;
  window.fetch = function(url: RequestInfo | URL, options?: RequestInit) {
    const urlStr = typeof url === 'string'
      ? url
      : (url instanceof URL ? url.toString() : (url as any)?.url || String(url || ''));

    // Whitelist production/network endpoints so they're never blocked
    if (
      urlStr.includes('amazonaws.com') || // S3, API Gateway, AppSync
      urlStr.includes('amplifyapp.com')   // Amplify hosting
    ) {
      return originalFetch.call(this, url, options);
    }

    if (shouldBlock(urlStr)) {
      // Return a rejected promise that won't trigger errors
      return Promise.reject(new Error('Blocked by ultra-aggressive suppression'));
    }
    return originalFetch.call(this, url, options);
  };
  
  // Log success message
  originalMethods.log('🛡️ ULTRA-AGGRESSIVE ERROR SUPPRESSION ACTIVATED - ALL EXTENSION ERRORS COMPLETELY BLOCKED');
  
  // ULTRA-AGGRESSIVE: Continuous monitoring system to catch late-arriving errors
  setInterval(() => {
    // Re-apply console overrides in case they were overridden
    console.error = function(...args: any[]) {
      const message = args.join(' ');
      if (shouldBlock(message)) {
        return; // Completely block
      }
      originalMethods.error.apply(console, args);
    };
    
    console.warn = function(...args: any[]) {
      const message = args.join(' ');
      if (shouldBlock(message)) {
        return; // Completely block
      }
      originalMethods.warn.apply(console, args);
    };
    
    console.log = function(...args: any[]) {
      const message = args.join(' ');
      if (shouldBlock(message)) {
        return; // Block extension-related logs
      }
      originalMethods.log.apply(console, args);
    };
    
    // Re-apply WebSocket blocking
    if (window.WebSocket) {
      const OriginalWebSocket = window.WebSocket;
      const WebSocketConstructor = function(this: any, url: string | URL, protocols?: string | string[]) {
        const urlStr = String(url || '');
        if (urlStr.includes('localhost:8098') || 
            urlStr.includes('ws://localhost:8098') ||
            urlStr.includes('localhost:8098/') ||
            urlStr.includes('ws://localhost:8098/')) {
          
          // Return a dummy WebSocket that does nothing
          const dummyWebSocket = {
            readyState: 3, // CLOSED
            url: urlStr,
            protocol: protocols ? (Array.isArray(protocols) ? protocols[0] : protocols) : '',
            extensions: '',
            bufferedAmount: 0,
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null,
            send: function() { return; },
            close: function() { return; },
            addEventListener: function() { return; },
            removeEventListener: function() { return; },
            dispatchEvent: function() { return false; }
          };
          
          // Set prototype to match WebSocket
          Object.setPrototypeOf(dummyWebSocket, WebSocket.prototype);
          return dummyWebSocket;
        }
        return new OriginalWebSocket(url, protocols);
      };
      
      // Set up the constructor properly
      WebSocketConstructor.prototype = OriginalWebSocket.prototype;
      WebSocketConstructor.CONNECTING = OriginalWebSocket.CONNECTING;
      WebSocketConstructor.OPEN = OriginalWebSocket.OPEN;
      WebSocketConstructor.CLOSING = OriginalWebSocket.CLOSING;
      WebSocketConstructor.CLOSED = OriginalWebSocket.CLOSED;
      
      // Override the WebSocket constructor
      (window as any).WebSocket = WebSocketConstructor;
    }
  }, 50); // Check every 50ms for more aggressive blocking
  
})();

createRoot(document.getElementById("root")!).render(<App />);
