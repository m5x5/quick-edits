import type { InputHTMLAttributes } from "react";

type InputProps = {
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`rounded-[4px] text-xs border border-gray-300 py-[0.05rem] px-[0.2rem] placeholder:text-gray-400 dark:text-white dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}