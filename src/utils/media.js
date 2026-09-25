const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** URL absolue d'un fichier uploadé (le backend ne renvoie qu'un chemin relatif type /uploads/...). */
export const assetUrl = (path) => (path ? `${API_ORIGIN}${path}` : '');
