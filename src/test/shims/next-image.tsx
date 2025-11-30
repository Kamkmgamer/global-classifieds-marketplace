/* eslint-disable @next/next/no-img-element */
import * as React from 'react';

// Simple shim for next/image in Jest
interface NextImageProps {
  src: string | { src: string };
  alt?: string;
  [key: string]: unknown;
}

const NextImage = ({ src, alt = '', ...props }: NextImageProps) => (
  <img src={typeof src === 'string' ? src : ''} alt={alt} {...props} />
);
export default NextImage;
