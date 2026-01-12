import { useState, useCallback } from "react";
import { extractErrorMessage } from "../utils/errorUtils";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useApi = <T,>(options?: UseApiOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, data, reset };
};

