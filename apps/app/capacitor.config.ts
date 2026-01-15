import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.thembassy.localaid',
  appName: 'Local Aid',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
