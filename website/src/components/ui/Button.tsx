export function Button({
  children,
  type,
  onClick,
}: {
  children: React.ReactNode[] | React.ReactNode | string;
  type: "submit" | "reset" | "button" | undefined;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-white focus-visible:border-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
    >
      {children}
    </button>
  );
}
