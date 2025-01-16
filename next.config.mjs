/** @type {import('next').NextConfig} */
const config = {
  // Enable static file serving for fonts
  assetPrefix: '',
  // Disable image optimization for fonts
  images: {
    disableStaticImages: true,
  },
};

export default config; 