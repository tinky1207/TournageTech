const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withWearConnectivity(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];

    // Helper to add permission if not present
    const addPermissionIfMissing = (permissions, name) => {
      if (!permissions.some(p => p.$['android:name'] === name)) {
        permissions.push({ $: { 'android:name': name } });
      }
    };

    // Add permissions if missing
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.INTERNET');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.WAKE_LOCK');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.FOREGROUND_SERVICE');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.FOREGROUND_SERVICE_DATA_SYNC');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.BLUETOOTH_CONNECT');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.BLUETOOTH_SCAN');
    addPermissionIfMissing(manifest['uses-permission'], 'android.permission.BLUETOOTH_ADVERTISE');

    // Add service if missing
    application.service = application.service || [];
    const serviceName = 'com.wearconnectivity.WearConnectivityTask';
    if (!application.service.some(s => s.$['android:name'] === serviceName)) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'false',
          'android:foregroundServiceType': 'dataSync|connectedDevice',
          'android:permission': 'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE'
        }
      });
    }

    return config;
  });
};