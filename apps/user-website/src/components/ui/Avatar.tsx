import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6',   text: 'text-[9px]'  },
  sm: { container: 'w-8 h-8',   text: 'text-xs'     },
  md: { container: 'w-10 h-10', text: 'text-sm'     },
  lg: { container: 'w-12 h-12', text: 'text-base'   },
  xl: { container: 'w-16 h-16', text: 'text-xl'     },
};

/** Derives 1–2 letter initials from name, email, or phone */
function getInitials(name?: string | null, phoneNumber?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim()[0]?.toUpperCase() ?? '?';
  }
  if (phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.slice(-2);
  }
  return '?';
}

export const Avatar = ({
  src,
  name,
  phoneNumber,
  size = 'md',
  className = '',
}: AvatarProps) => {
  const { container, text } = sizeMap[size];
  const initials = getInitials(name, phoneNumber);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  // Clean and normalize src URL (rewrite accidental localhost to production Render API)
  let resolvedSrc = src?.trim();
  if (resolvedSrc && (resolvedSrc.startsWith('http://localhost:') || resolvedSrc.startsWith('http://127.0.0.1:'))) {
    resolvedSrc = resolvedSrc.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, 'https://airion-api.onrender.com');
  }

  const hasImage = Boolean(resolvedSrc && !imgError);

  return (
    <div
      className={[
        container,
        'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative select-none',
        hasImage ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-br from-[var(--ease2event-brand-primary,#FF385C)] to-[var(--ease2event-brand-secondary,#E00B41)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasImage ? (
        <img
          src={resolvedSrc!}
          alt={name ?? 'avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials !== '?' ? (
        <span className={`${text} font-bold text-white select-none leading-none`}>{initials}</span>
      ) : (
        <User className="text-white w-1/2 h-1/2" />
      )}
    </div>
  );
};

export default Avatar;
