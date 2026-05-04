import { useState, useEffect, useCallback, useMemo } from "react";
import { sdk } from "@/shared/sdk";
import type { ProviderFieldValue, ProviderStatus } from "@/core/domain";

interface UseCredentialsReturn {
  configuredIds: Set<string>;
  loading: boolean;
  saving: boolean;
  needsRestart: boolean;
  getConfig: (providerId: string) => Promise<ProviderFieldValue[]>;
  save: (key: string, value: string) => Promise<void>;
  remove: (providerId: string) => Promise<void>;
  restart: () => Promise<void>;
  completeNativeSetup: () => Promise<void>;
}

export function useCredentials(): UseCredentialsReturn {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);

  const refreshStatuses = useCallback(async () => {
    const nextStatuses = await sdk.providers.credentials.checkAllStatus();
    setStatuses(nextStatuses);
    return nextStatuses;
  }, []);

  useEffect(() => {
    refreshStatuses()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshStatuses]);

  const configuredIds = useMemo(
    () =>
      new Set(statuses.filter((s) => s.isConfigured).map((s) => s.providerId)),
    [statuses],
  );

  const getConfig = useCallback(async (providerId: string) => {
    return sdk.providers.credentials.getConfig(providerId);
  }, []);

  const save = useCallback(
    async (key: string, value: string) => {
      setSaving(true);
      try {
        await sdk.providers.credentials.saveField(key, value);
        await refreshStatuses();
        setNeedsRestart(true);
      } finally {
        setSaving(false);
      }
    },
    [refreshStatuses],
  );

  const remove = useCallback(
    async (providerId: string) => {
      setSaving(true);
      try {
        await sdk.providers.credentials.deleteConfig(providerId);
        await refreshStatuses();
        setNeedsRestart(true);
      } finally {
        setSaving(false);
      }
    },
    [refreshStatuses],
  );

  const restart = useCallback(async () => {
    await sdk.providers.credentials.restartApp();
  }, []);

  const completeNativeSetup = useCallback(async () => {
    await refreshStatuses();
    setNeedsRestart(true);
  }, [refreshStatuses]);

  return {
    configuredIds,
    loading,
    saving,
    needsRestart,
    getConfig,
    save,
    remove,
    restart,
    completeNativeSetup,
  };
}
