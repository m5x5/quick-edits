import { useCallback, useEffect, useState } from "react";
import Button from "./Button";

interface NativeHostStatusProps {
  testOnMount?: boolean;
  showRetryButton?: boolean;
  className?: string;
}

export const NativeHostStatus = ({ 
  testOnMount = true, 
  showRetryButton = false,
  className = ""
}: NativeHostStatusProps) => {
  const [nativeHostError, setNativeHostError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [errorTime, setErrorTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testNativeHostConnection = useCallback(() => {
    setIsLoading(true);
    const startTime = Date.now();
    
    chrome.runtime.sendMessage(
      {
        action: "test_native_host",
        folder: "some/invalid/folder",
        classes: "hello",
        textContent: "hello",
        browserUrl: "",
      },
      (response) => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const timestamp = new Date().toLocaleString();
        setIsLoading(false);
        
        if (!response?.success) {
          setNativeHostError(true);
          setErrorMessage(
            response?.message || "Native messaging host is not accessible"
          );
          setErrorTime(timestamp);
          setSuccessMessage(null);
        } else {
          setNativeHostError(false);
          setErrorMessage(null);
          setSuccessMessage("Native host connection test successful");
          setExecutionTime(duration);
          setLastRunTime(timestamp);
        }
      }
    );
  }, []);

  useEffect(() => {
    // Listen for native messaging host errors
    const messageListener = (message: { type: string; message: string }) => {
      if (message.type === "native_host_error") {
        setNativeHostError(true);
        setErrorMessage(message.message);
        setErrorTime(new Date().toLocaleString());
        setSuccessMessage(null);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Test native messaging host connection on mount if requested
    if (testOnMount) {
      testNativeHostConnection();
    }

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [testNativeHostConnection, testOnMount]);

  return (
    <div className={className}>
      {nativeHostError && (
        <div
          className="m-2 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Native Messaging Host Error</strong>
          <span className="block sm:inline">
            {" "}
            {errorMessage ||
              "The native messaging host is not accessible. Please follow the setup instructions at "}
            <a
              href="https://quick-edits.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-800 dark:hover:text-red-200 mx-1"
            >
              quick-edits.dev
            </a>
            to configure the native messaging host.
          </span>
          {errorTime && (
            <div className="text-xs mt-2 opacity-75">
              Last error: {errorTime}
            </div>
          )}
        </div>
      )}
      {successMessage && !nativeHostError && (
        <div
          className="m-2 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Success</strong>
          <span className="block sm:inline"> {successMessage}</span>
          <div className="text-xs mt-2 opacity-75">
            {executionTime !== null && (
              <span>Execution time: {executionTime.toFixed(3)}s</span>
            )}
            {lastRunTime && (
              <span className="ml-4">Last run: {lastRunTime}</span>
            )}
          </div>
        </div>
      )}
      {showRetryButton && (
        <Button
          onClick={testNativeHostConnection}
          disabled={isLoading}
        >
          {isLoading ? "Testing..." : nativeHostError ? "Retry Connection" : "Test Connection"}
        </Button>
      )}
    </div>
  );
};

export default NativeHostStatus; 