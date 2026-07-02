import localFont from 'next/font/local';

export const Peyda = localFont({
  src: [
    {
      path: '../../assets/fonts/Peyda/PeydaWeb-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Peyda/PeydaWeb-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Peyda//PeydaWeb-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Peyda/PeydaWeb-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Peyda/PeydaWeb-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-peyda',
  display: 'swap',
  fallback: ['system-ui', 'Tahoma', 'sans-serif'],
  preload: true,
});