'use client';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message = 'Something went wrong.', onRetry }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-zinc-500">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-black hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
