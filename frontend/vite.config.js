import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import os from 'os';

/**
 * Lấy địa chỉ IPv4 của card mạng vật lý đang hoạt động (Wi-Fi / Ethernet),
 * loại trừ triệt để các card ảo (WSL, VMware, VirtualBox, Docker, Hyper-V, APIPA).
 */
function getActivePhysicalNetworkIp() {
  const interfaces = os.networkInterfaces();
  let physicalIp = null;
  let fallbackIp = null;

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const isVirtual = /vethernet|vmware|virtualbox|vbox|loopback|wsl|docker|hyper-v/i.test(name);

    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254.')) {
        if (!isVirtual) {
          return addr.address; // Ưu tiên card vật lý thực tế
        }
        if (!fallbackIp) {
          fallbackIp = addr.address;
        }
      }
    }
  }

  return physicalIp || fallbackIp;
}

/**
 * Plugin giới hạn đúng 1 Network URL duy nhất khi chạy Frontend Vite.
 */
function singleNetworkUrlPlugin() {
  return {
    name: 'single-network-url',
    configureServer(server) {
      const filterNetworkUrls = () => {
        if (!server.resolvedUrls?.network?.length) return;

        const physicalIp = getActivePhysicalNetworkIp();
        let targetUrl = null;

        if (physicalIp) {
          targetUrl = server.resolvedUrls.network.find((url) => url.includes(physicalIp));
        }

        if (!targetUrl) {
          targetUrl =
            server.resolvedUrls.network.find(
              (url) => !url.includes('169.254.') && !url.includes('172.')
            ) || server.resolvedUrls.network[0];
        }

        server.resolvedUrls.network = targetUrl ? [targetUrl] : [];
      };

      server.httpServer?.once('listening', filterNetworkUrls);

      const originalPrintUrls = server.printUrls;
      server.printUrls = () => {
        filterNetworkUrls();
        originalPrintUrls.call(server);
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), singleNetworkUrlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/v3/api-docs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});

