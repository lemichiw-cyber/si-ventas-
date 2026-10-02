import { useState } from 'react';
import fallbackProduct from '../assets/fallback-product.svg';

interface FallbackImgProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Image component with graceful fallback when the source fails to load.
 * Replaces broken `via.placeholder.com` URLs throughout the app.
 */
export default function FallbackImg({ src, alt, className, loading = 'lazy' }: FallbackImgProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackProduct);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackProduct) {
      setImgSrc(fallbackProduct);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
}
