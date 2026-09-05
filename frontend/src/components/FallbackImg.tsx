import { useState } from 'react';

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
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && src !== '/src/assets/fallback-product.svg') {
      setImgSrc('/src/assets/fallback-product.svg');
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
