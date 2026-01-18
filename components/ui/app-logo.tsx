import React from 'react'

interface AppLogoProps {
  className?: string
  size?: number
}

export function AppLogo({ className = '', size = 32 }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Yukarı bakan ok/A harfi şekli - minimal ve keskin geometrik tasarım */}
      {/* Üst kısım - büyük ters V şekli (okun üst kısmı) */}
      <path
        d="M50 10 L20 55 L50 55 Z"
        fill="currentColor"
      />
      <path
        d="M50 10 L80 55 L50 55 Z"
        fill="currentColor"
      />
      {/* Alt kısım - elmas şekli (okun ucu), üst kısımla birleşik */}
      <path
        d="M50 55 L35 75 L50 90 L65 75 Z"
        fill="currentColor"
      />
    </svg>
  )
}
