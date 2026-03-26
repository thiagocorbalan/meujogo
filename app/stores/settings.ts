import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
  const { getSettings, updateSettings } = useSettings();
  const settings = ref<any>(null);
  const loading = ref(false);

  async function fetchSettings() {
    loading.value = true;
    try { settings.value = await getSettings(); }
    finally { loading.value = false; }
  }

  async function update(data: any) {
    loading.value = true;
    try {
      settings.value = await updateSettings(data);
    } finally { loading.value = false; }
  }

  return { settings, loading, fetchSettings, update };
});
