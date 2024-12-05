declare module '*.png';
declare module '*.jpg';
declare module '*.gif';
declare module '*.svg';

declare module React {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
