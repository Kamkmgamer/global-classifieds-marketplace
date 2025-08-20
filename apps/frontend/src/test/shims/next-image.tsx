import * as React from 'react';

// Simple shim for next/image in Jest
// eslint-disable-next-line @next/next/no-img-element
interface NextImageProps {
  src: string | { src: string };
  alt?: string;
  [key: string]: unknown;
}

const NextImage = ({ src, alt = '', ...props }: NextImageProps) => <img src={typeof src === 'string' ? src : ''} alt={alt} {...props} />;
export default NextImage;
