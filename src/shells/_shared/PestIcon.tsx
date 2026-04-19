import React from 'react';

interface Props {
  pest: string;
  size?: number;
  className?: string;
}

const ICON_PATHS: Record<string, React.ReactNode> = {
  'ant-control': (
    <>
      <circle cx="6" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="18" cy="12" r="2" fill="currentColor" />
      <line x1="8" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="10" x2="2" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="20" y1="10" x2="22" y2="8" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'bed-bug-control': (
    <>
      <ellipse cx="12" cy="13" rx="7" ry="5" fill="currentColor" />
      <line x1="12" y1="8" x2="12" y2="18" stroke="white" strokeWidth="0.6" />
      <line x1="6" y1="13" x2="18" y2="13" stroke="white" strokeWidth="0.4" />
    </>
  ),
  'roach-control': (
    <>
      <ellipse cx="12" cy="13" rx="5" ry="7" fill="currentColor" />
      <line x1="12" y1="6" x2="10" y2="3" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="6" x2="14" y2="3" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="13" x2="4" y2="14" stroke="currentColor" strokeWidth="1" />
      <line x1="17" y1="13" x2="20" y2="14" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'flea-tick-control': (
    <>
      <circle cx="12" cy="13" r="4" fill="currentColor" />
      <circle cx="10" cy="11" r="0.7" fill="white" />
      <line x1="9" y1="17" x2="7" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <line x1="15" y1="17" x2="17" y2="20" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  'mosquito-control': (
    <>
      <ellipse cx="12" cy="14" rx="1.5" ry="4" fill="currentColor" />
      <line x1="12" y1="10" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="8" cy="9" rx="3" ry="1" fill="currentColor" opacity="0.5" />
      <ellipse cx="16" cy="9" rx="3" ry="1" fill="currentColor" opacity="0.5" />
    </>
  ),
  'rodent-control': (
    <>
      <ellipse cx="13" cy="14" rx="6" ry="4" fill="currentColor" />
      <circle cx="8" cy="11" r="1.8" fill="currentColor" />
      <circle cx="7" cy="9" r="1.2" fill="currentColor" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <line x1="19" y1="14" x2="22" y2="17" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'scorpion-control': (
    <>
      <ellipse cx="10" cy="14" rx="4" ry="2.5" fill="currentColor" />
      <path d="M 14 14 Q 19 13 20 9 Q 20 6 18 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 6 13 L 3 14" stroke="currentColor" strokeWidth="1" />
      <path d="M 6 15 L 3 16" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'spider-control': (
    <>
      <circle cx="12" cy="13" r="3" fill="currentColor" />
      <line x1="9" y1="13" x2="4" y2="10" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="14" x2="4" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="13" x2="20" y2="10" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="14" x2="20" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="11" x2="6" y2="6" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="11" x2="18" y2="6" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="16" x2="8" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="16" x2="16" y2="20" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'termite-control': (
    <>
      <ellipse cx="12" cy="13" rx="5" ry="2" fill="currentColor" />
      <circle cx="7" cy="13" r="1.5" fill="currentColor" />
      <line x1="7" y1="11.5" x2="5" y2="10" stroke="currentColor" strokeWidth="0.8" />
      <line x1="7" y1="14.5" x2="5" y2="16" stroke="currentColor" strokeWidth="0.8" />
    </>
  ),
  'termite-inspections': (
    <>
      <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" />
      <line x1="9" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1" />
      <line x1="11" y1="9" x2="11" y2="13" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  'wasp-hornet-control': (
    <>
      <ellipse cx="12" cy="14" rx="3" ry="5" fill="currentColor" />
      <line x1="9" y1="14" x2="15" y2="14" stroke="white" strokeWidth="1.2" />
      <ellipse cx="9" cy="11" rx="3" ry="1" fill="currentColor" opacity="0.5" />
      <ellipse cx="15" cy="11" rx="3" ry="1" fill="currentColor" opacity="0.5" />
    </>
  ),
  'pest-control': (
    <>
      <path d="M 6 18 L 12 6 L 18 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <line x1="12" y1="10" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
};

export function PestIcon({ pest, size = 24, className }: Props) {
  const icon = ICON_PATHS[pest];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {icon}
    </svg>
  );
}
