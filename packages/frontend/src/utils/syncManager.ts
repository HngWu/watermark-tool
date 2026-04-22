// packages/frontend/src/utils/syncManager.ts
export const syncWithCloud = async (templates: any[], settings: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates, settings, timestamp: Date.now() })
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};
