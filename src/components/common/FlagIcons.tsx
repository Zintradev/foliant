/**
 * High-definition vector flag icons for Spanish and English language selections.
 * Unlike emoji flags (which Windows Segoe UI Emoji does not support and renders as letters),
 * these vector SVGs render consistently across all platforms, including Windows desktop WebView2.
 */

export function EsFlag({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={`${className} rounded-[2px] shadow-xs shrink-0 select-none overflow-hidden`}
      viewBox="0 0 640 480"
      aria-hidden="true"
    >
      <path fill="#aa151b" d="M0 0h640v480H0z" />
      <path fill="#f1bf00" d="M0 120h640v240H0z" />
    </svg>
  );
}

export function GbFlag({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={`${className} rounded-[2px] shadow-xs shrink-0 select-none overflow-hidden`}
      viewBox="0 0 640 480"
      aria-hidden="true"
    >
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path
        fill="#ffffff"
        d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 64V0z"
      />
      <path
        fill="#c8102e"
        d="m424 281 216 159v40L369 281zm-48-41 264 195V480zM161 161 0 41V0zm48 40L0 46v39z"
      />
      <path fill="#ffffff" d="M256 0h128v480H256zM0 176h640v128H0z" />
      <path fill="#c8102e" d="M280 0h80v480h-80zM0 200h640v80H0z" />
    </svg>
  );
}
