export function CanadaFlag({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="18" fill="white"/>
      <rect width="9" height="18" fill="#FF0000"/>
      <rect x="27" width="9" height="18" fill="#FF0000"/>
      <path d="M18 4L19 7H22L19.5 9L20.5 12L18 10L15.5 12L16.5 9L14 7H17L18 4Z" fill="#FF0000"/>
    </svg>
  );
}
