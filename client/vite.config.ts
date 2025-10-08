import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: 'crypto-browserify',
    },
  },
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: [
      'aws-amplify',
      'aws-amplify/auth',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-cognito-identity',
      '@aws-sdk/credential-provider-cognito-identity',
      '@aws-sdk/s3-request-presigner',
      '@aws-sdk/util-dynamodb',
      '@aws-sdk/credential-provider-cognito-identity/lib/loadCognitoIdentity'
    ],
    exclude: [],
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          aws: ['aws-amplify', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true,
    //     secure: false,
    //     configure: (proxy, options) => {
    //       proxy.on('error', (err, req, res) => {
    //         console.log('proxy error', err);
    //       });
    //       proxy.on('proxyReq', (proxyReq, req, res) => {
    //         console.log('Sending Request to the Target:', req.method, req.url);
    //       });
    //       proxy.on('proxyRes', (proxyRes, req, res) => {
    //         console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
    //       });
    //     },
    //   },
    // },
  },
  ssr: {
    noExternal: ['@aws-sdk/*', 'aws-amplify']
  }
});
