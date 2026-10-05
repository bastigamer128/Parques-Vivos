import { Activity, ForumPost, Neighbor, UserProfile } from '../types';

// Real coordinates of Parque Almagro, Santiago Centro
// Real OpenStreetMap boundaries: Bounded by Calle Santa Isabel (North), Mensía de los Nidos (South), San Diego (East) and Dieciocho / U. Central (West)
export const PARQUE_ALMAGRO_BOUNDS_POLYGON: [number, number][] = [
  [-33.45140, -70.65040], // North-East: Santa Isabel con San Diego / Plazoleta Sacramentinos
  [-33.45145, -70.65150], // Santa Isabel / Acceso Metro Parque Almagro
  [-33.45150, -70.65350], // Santa Isabel con Nataniel Cox
  [-33.45155, -70.65480], // Santa Isabel con Lord Cochrane
  [-33.45160, -70.65620], // Santa Isabel con San Ignacio
  [-33.45165, -70.65730], // North-West: Santa Isabel con Dieciocho (Campus U. Central)
  [-33.45275, -70.65730], // South-West: Mensía de los Nidos con Dieciocho
  [-33.45270, -70.65620], // Mensía de los Nidos con San Ignacio
  [-33.45265, -70.65480], // Mensía de los Nidos con Lord Cochrane
  [-33.45260, -70.65350], // Mensía de los Nidos con Nataniel Cox
  [-33.45255, -70.65150], // Mensía de los Nidos cerca de San Diego
  [-33.45250, -70.65040], // South-East: San Diego con Mensía de los Nidos
];

// Helper point-in-polygon with slight tolerance buffer
export function isPointInsideParqueAlmagro(lat: number, lng: number): boolean {
  const vs = PARQUE_ALMAGRO_BOUNDS_POLYGON;
  let inside = false;
  
  // Expand bounds slightly (~25 meters tolerance for borders and sidewalks)
  const latBuffer = 0.00035;
  const lngBuffer = 0.00045;

  const minLat = -33.45280 - latBuffer;
  const maxLat = -33.45140 + latBuffer;
  const minLng = -70.65730 - lngBuffer;
  const maxLng = -70.65040 + lngBuffer;

  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
    return false;
  }

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  // Also accept within bounding box with buffer
  return inside || (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);
}

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-almagro-1',
    title: 'Yoga & Meditación al Atardecer de Primavera',
    description: 'Sesión comunitaria de Hatha Yoga y relajación consciente. Trae tu mat o toalla. Juntarnos en grupo nos permite disfrutar del parque hasta el anochecer con total tranquilidad y resguardo mutuo.',
    locationName: 'Explanada Monumento Central Diego de Almagro',
    lat: -33.45210,
    lng: -70.65360,
    date: 'Hoy, 19:00 hrs',
    rawDate: '2026-10-05T19:00',
    category: 'deporte',
    creatorName: 'Valeria Castro',
    creatorRole: 'Instructora de Yoga (San Diego)',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 21,
    isAttending: true,
    status: 'activa',
    safetyTip: 'Zona central despejada con iluminación continua de farolas solares.'
  },
  {
    id: 'act-almagro-2',
    title: 'Socialización Canina & Adiestramiento Positivo',
    description: 'Encuentro vecinal para tutores perrunos. Ejercicios básicos de concentración y obediencia con refuerzo positivo, tips de salud y juego libre dentro del recinto.',
    locationName: 'Canil Cerrado Parque Almagro (Sendero Lord Cochrane)',
    lat: -33.45220,
    lng: -70.65550,
    date: 'Hoy, 19:45 hrs',
    rawDate: '2026-10-05T19:45',
    category: 'mascotas',
    creatorName: 'Rodrigo Fuentes',
    creatorRole: 'Comité Canino Almagro',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 16,
    isAttending: true,
    status: 'activa',
    safetyTip: 'Ingreso con correa obligatoria; traer bolsas de desechos y bebedero portátil.'
  },
  {
    id: 'act-almagro-3',
    title: 'Entrenamiento Funcional & Calistenia en Barras',
    description: 'Circuito matutino guiado de acondicionamiento físico, dominadas, sentadillas y movilidad articular para empezar el día con energía comunitaria.',
    locationName: 'Sector Calistenia y Barras (Nataniel Cox)',
    lat: -33.45190,
    lng: -70.65420,
    date: 'Mañana, 07:45 hrs',
    rawDate: '2026-10-06T07:45',
    category: 'deporte',
    creatorName: 'Felipe Tapia',
    creatorRole: 'Entrenador Físico Comunitario',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 12,
    isAttending: false,
    status: 'proxima',
    safetyTip: 'Punto visible junto al sendero norte con alto flujo de deportistas matutinos.'
  },
  {
    id: 'act-almagro-4',
    title: 'Feria del Trueque y Libros Usados de Barrio',
    description: 'Intercambio de literatura, plantas, esquejes y juegos de mesa en buen estado. Fomentamos la economía circular, la cultura y la vida de plaza frente a la Basílica.',
    locationName: 'Plazoleta Basílica Sacramentinos (San Diego esq. Santa Isabel)',
    lat: -33.45200,
    lng: -70.65080,
    date: 'Sábado, 11:00 hrs',
    rawDate: '2026-10-10T11:00',
    category: 'cultura',
    creatorName: 'Doña Elena Riquelme',
    creatorRole: 'Vecina de San Diego (35 años en el barrio)',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 18,
    isAttending: false,
    status: 'proxima',
    safetyTip: 'Actividad familiar diurna con ambiente tranquilo frente a los cafés del barrio.'
  },
  {
    id: 'act-almagro-5',
    title: 'Tarde de Cuentacuentos y Teatro Infantil',
    description: 'Narración de cuentos comunitarios y títeres para niñas y niños del sector. Trae una manta o cojín para disfrutar de una tarde entretenida a la sombra de los árboles.',
    locationName: 'Pérgola y Juegos Infantiles de Madera',
    lat: -33.45205,
    lng: -70.65220,
    date: 'Domingo, 16:30 hrs',
    rawDate: '2026-10-11T16:30',
    category: 'infantil',
    creatorName: 'Constanza Morales',
    creatorRole: 'Colectivo Niñez & Plaza',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 24,
    isAttending: false,
    status: 'proxima',
    safetyTip: 'Zona acordonada para recreación infantil alejada del tránsito de vehículos.'
  },
  {
    id: 'act-almagro-6',
    title: 'Picnic Vecinal & Torneo de Ajedrez al Aire Libre',
    description: 'Mesas plegables, tableros de ajedrez, naipes y mateada abierta. Espacio de diálogo y encuentro entre jóvenes universitarios y vecinos históricos del parque.',
    locationName: 'Pradera Verde Poniente (frente a U. Central)',
    lat: -33.45225,
    lng: -70.65660,
    date: 'Viernes, 17:30 hrs',
    rawDate: '2026-10-09T17:30',
    category: 'social',
    creatorName: 'Don Ernesto Morales',
    creatorRole: 'Vecino de Lord Cochrane',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 15,
    isAttending: true,
    status: 'proxima',
    safetyTip: 'Compromiso de cuidado ambiental: retiramos toda la basura generada al finalizar.'
  },
  {
    id: 'act-almagro-7',
    title: 'Ronda Vecinal Iluminada de Regreso Seguro',
    description: 'Acompañamiento preventivo en grupo para estudiantes y trabajadores que regresan del metro Parque Almagro, recorriendo los senderos con chalecos reflectantes y silbatos.',
    locationName: 'Acceso Metro Parque Almagro (Línea 3)',
    lat: -33.45155,
    lng: -70.65070,
    date: 'Jueves, 20:30 hrs',
    rawDate: '2026-10-08T20:30',
    category: 'seguridad',
    creatorName: 'Junta de Vecinos Almagro Seguro',
    creatorRole: 'Coordinación Barrial',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    attendeesCount: 27,
    isAttending: true,
    status: 'proxima',
    safetyTip: 'Ronda organizada en parejas con chalecos reflectantes y comunicación vecinal.'
  }
];

export const INITIAL_POSTS: ForumPost[] = [
  {
    id: 'post-1',
    authorName: 'Camila Rojas',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    authorBadge: 'Vecina San Diego',
    timeAgo: 'Hace 2 horas',
    category: 'Ideas',
    content: '¿Qué les parece solicitar a la municipalidad un punto de hidratación con bebedero accesible cerca del canil y los juegos infantiles? Ahora que viene el calor sería ideal para niños, mascotas y deportistas.',
    likes: 28,
    isLiked: false,
    commentsCount: 3,
    tag: '#MejorasParque',
    comments: [
      {
        id: 'c-1-1',
        postId: 'post-1',
        authorName: 'Don Ernesto Morales',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Vecino San Diego',
        timeAgo: 'Hace 1 hora',
        content: '¡Excelente iniciativa Camila! Para los adultos mayores que caminamos en las tardes es indispensable tener agua fresca cerca sin tener que cruzar San Diego.',
        likes: 12,
        isLiked: false
      },
      {
        id: 'c-1-2',
        postId: 'post-1',
        authorName: 'Rodrigo Fuentes',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Comité Canino',
        timeAgo: 'Hace 45 min',
        content: 'Apoyo 100%. Podríamos pedir que incluya plato bajo para perritos. Con el calor que hace en verano el canil se queda sin agua rápidamente.',
        likes: 9,
        isLiked: true,
        replyToAuthor: 'Camila Rojas'
      },
      {
        id: 'c-1-3',
        postId: 'post-1',
        authorName: 'Carolina Paz',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Junta de Vecinos #14',
        timeAgo: 'Hace 15 min',
        content: 'Lo podemos poner como punto prioritario en la asamblea de este jueves. Si juntamos 30 firmas vecinales, la Dirección de Medio Ambiente lo gestiona rápido.',
        likes: 15,
        isLiked: false,
        replyToAuthor: 'Camila Rojas'
      }
    ]
  },
  {
    id: 'post-2',
    authorName: 'Manuel Sepúlveda',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    authorBadge: 'Vecino Santa Isabel',
    timeAgo: 'Hace 5 horas',
    category: 'Reseñas',
    content: '¡Tremenda jornada la de hoy! Nos juntamos más de 14 vecinos a trotar a las 19:00 hrs. Ver el parque lleno de gente haciendo actividades realmente cambia la vibra y ahuyenta la soledad e inseguridad. ¡Sigamos coordinando salidas!',
    likes: 45,
    isLiked: true,
    commentsCount: 2,
    tag: '#ParqueVivo',
    comments: [
      {
        id: 'c-2-1',
        postId: 'post-2',
        authorName: 'Valeria Castro',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Instructora Yoga',
        timeAgo: 'Hace 3 horas',
        content: '¡Fue genial verlos pasar mientras terminábamos la clase de yoga! Los senderos se sintieron súper iluminados y acompañados.',
        likes: 8,
        isLiked: true
      },
      {
        id: 'c-2-2',
        postId: 'post-2',
        authorName: 'Felipe Tapia',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Entrenador Calistenia',
        timeAgo: 'Hace 2 horas',
        content: 'Mañana repetimos a las 07:30 am antes de entrar al trabajo. ¡Los que quieran sumarse nos vemos en las barras!',
        likes: 11,
        isLiked: false,
        replyToAuthor: 'Manuel Sepúlveda'
      }
    ]
  },
  {
    id: 'post-3',
    authorName: 'Patricia Undurraga',
    authorAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&q=80',
    authorBadge: 'Comité Adulto Mayor',
    timeAgo: 'Ayer',
    category: 'Panorama',
    content: 'Este domingo tendremos tejido al aire libre y trueque de plantas cerca de la Basílica de los Sacramentinos desde las 11:00 am. Vengan con sus termos de té y mates. ¡Están todos invitados!',
    likes: 34,
    isLiked: false,
    commentsCount: 1,
    tag: '#ComunidadAlmagro',
    comments: [
      {
        id: 'c-3-1',
        postId: 'post-3',
        authorName: 'Camila Rojas',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Vecina San Diego',
        timeAgo: 'Ayer',
        content: '¡Llevaré esquejes de suculentas y menta para compartir! Qué linda iniciativa.',
        likes: 6,
        isLiked: false
      }
    ]
  },
  {
    id: 'post-4',
    authorName: 'Ignacio Barrientos',
    authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    authorBadge: 'Estudiante U. Central',
    timeAgo: 'Ayer',
    category: 'Ideas',
    content: 'Revisé las luminarias del costado de Lord Cochrane: hay 3 postes con las ampollas parpadeando. Ya ingresé el número de reclamo municipal #83921. Ojalá lo reparen antes del fin de semana.',
    likes: 19,
    isLiked: false,
    commentsCount: 1,
    tag: '#SeguridadVecinal',
    comments: [
      {
        id: 'c-4-1',
        postId: 'post-4',
        authorName: 'Carolina Paz',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        authorBadge: 'Vigilancia Verde',
        timeAgo: 'Ayer',
        content: 'Gracias por el reporte y número de caso Ignacio. En la ronda de esta noche llevaremos linternas de alta potencia por ese tramo mientras lo arreglan.',
        likes: 9,
        isLiked: true
      }
    ]
  }
];

export const ACTIVE_NEIGHBORS: Neighbor[] = [
  {
    id: 'n-1',
    name: 'Valeria Castro',
    role: 'Líder Yoga & Bienestar',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    badgeColor: 'bg-emerald-500'
  },
  {
    id: 'n-2',
    name: 'Rodrigo Fuentes',
    role: 'Coordinador Zona Canina',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    badgeColor: 'bg-amber-500'
  },
  {
    id: 'n-3',
    name: 'Don Ernesto M.',
    role: 'Delegado Adultos Mayores',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    badgeColor: 'bg-teal-500'
  },
  {
    id: 'n-4',
    name: 'Carolina Paz',
    role: 'Vigilancia Verde Comunitaria',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    badgeColor: 'bg-indigo-500'
  }
];

export const INITIAL_USER: UserProfile = {
  name: 'Bastián González',
  email: 'bastian.almagro@comunidad.cl',
  addressArea: 'San Diego con Santa Isabel (Edificio Parque II)',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  isVerified: true,
  activitiesCreated: 2,
  activitiesAttended: 5,
  reputationPoints: 180,
  bio: 'Vecino del Parque Almagro desde hace 3 años. Convencido de que un parque habitado por sus vecinos es un parque seguro y alegre para todos.'
};

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bgBadge: string; textBadge: string; border: string }> = {
  deporte: {
    label: 'Deporte & Salud',
    icon: 'Activity',
    color: '#059669', // emerald-600
    bgBadge: 'bg-emerald-100',
    textBadge: 'text-emerald-800',
    border: 'border-emerald-500'
  },
  mascotas: {
    label: 'Mascotas',
    icon: 'Dog',
    color: '#ea580c', // orange-600
    bgBadge: 'bg-orange-100',
    textBadge: 'text-orange-800',
    border: 'border-orange-500'
  },
  cultura: {
    label: 'Cultura & Juegos',
    icon: 'BookOpen',
    color: '#0284c7', // sky-600
    bgBadge: 'bg-sky-100',
    textBadge: 'text-sky-800',
    border: 'border-sky-500'
  },
  seguridad: {
    label: 'Ronda & Cuidado',
    icon: 'ShieldCheck',
    color: '#dc2626', // red-600
    bgBadge: 'bg-red-100',
    textBadge: 'text-red-800',
    border: 'border-red-500'
  },
  infantil: {
    label: 'Infantil & Familia',
    icon: 'Smile',
    color: '#d97706', // amber-600
    bgBadge: 'bg-amber-100',
    textBadge: 'text-amber-800',
    border: 'border-amber-500'
  },
  social: {
    label: 'Encuentro Vecinal',
    icon: 'Users',
    color: '#16a34a', // green-600
    bgBadge: 'bg-green-100',
    textBadge: 'text-green-800',
    border: 'border-green-500'
  }
};

export const PARQUE_ALMAGRO_ZONES = [
  { name: 'Explanada Diego de Almagro (Centro)', lat: -33.45210, lng: -70.65360 },
  { name: 'Zona Canil (Lord Cochrane a San Ignacio)', lat: -33.45220, lng: -70.65550 },
  { name: 'Pérgola y Juegos Infantiles Centrales', lat: -33.45205, lng: -70.65220 },
  { name: 'Sector Calistenia y Barras (Nataniel Cox)', lat: -33.45190, lng: -70.65420 },
  { name: 'Acceso Metro Parque Almagro (L3)', lat: -33.45155, lng: -70.65070 },
  { name: 'Plazoleta San Diego / Sacramentinos', lat: -33.45200, lng: -70.65080 },
  { name: 'Pradera Poniente (Frente a U. Central)', lat: -33.45225, lng: -70.65660 }
];
