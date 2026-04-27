/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 //localhost'un portunu buradan ayarlıyoruz.
  }
  
})
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // localhost'un portunu buradan ayarlıyoruz
    open: true, // Proje başlatıldığında tarayıcıyı otomatik olarak açar
  },
  build: {
    sourcemap: false, // Source map oluşturmayı devre dışı bırakır
  },
  resolve: {
    alias: {
      '@': '/src', // '@' sembolü ile src klasörüne kolay erişim sağlar
    },
  },
});



