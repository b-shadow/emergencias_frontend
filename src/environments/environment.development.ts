// Detección automática: si es localhost, usa backend local; si no, usa cloud
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }
  }
  return 'https://emergencias-backend.onrender.com/api/v1';
};

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
  appName: 'Plataforma de Emergencias Vehiculares - Dev',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
};
