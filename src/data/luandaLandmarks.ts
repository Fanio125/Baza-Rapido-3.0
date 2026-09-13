export interface LuandaLandmark {
  id: string;
  name: string;
  secondaryText: string;
  address: string;
  category: string;
  iconType: 'airport' | 'shopping' | 'landmark' | 'stadium' | 'hospital' | 'university' | 'urban';
  lat: number;
  lng: number;
  keywords: string[];
}

export const LUANDA_LANDMARKS: LuandaLandmark[] = [
  {
    id: 'landmark-aeroporto-4-fevereiro',
    name: 'Aeroporto Internacional 4 de Fevereiro',
    secondaryText: 'Avenida 21 de Janeiro, Maianga',
    address: 'Aeroporto Internacional Quatro de Fevereiro, Avenida 21 de Janeiro, Luanda, Angola',
    category: 'Aeroporto',
    iconType: 'airport',
    lat: -8.8504,
    lng: 13.2312,
    keywords: ['aeroporto', '4 de fevereiro', 'quatro de fevereiro', 'voos', 'terminal', 'maianga', '21 de janeiro', 'embarque']
  },
  {
    id: 'landmark-marginal-luanda',
    name: 'Marginal de Luanda (Baía de Luanda)',
    secondaryText: 'Avenida 4 de Fevereiro, Ingombota',
    address: 'Marginal de Luanda, Avenida 4 de Fevereiro, Luanda, Angola',
    category: 'Orla & Lazer',
    iconType: 'landmark',
    lat: -8.8078,
    lng: 13.2241,
    keywords: ['marginal', 'baia', 'baía', '4 de fevereiro', 'ingombota', 'porto', 'mar', 'baixa']
  },
  {
    id: 'landmark-belas-shopping',
    name: 'Belas Shopping',
    secondaryText: 'Avenida Luanda Sul, Talatona',
    address: 'Belas Shopping, Avenida Luanda Sul, Talatona, Luanda, Angola',
    category: 'Shopping',
    iconType: 'shopping',
    lat: -8.9198,
    lng: 13.1818,
    keywords: ['belas', 'shopping', 'talatona', 'cinema', 'lojas', 'luanda sul']
  },
  {
    id: 'landmark-shopping-avennida',
    name: 'Shopping Avennida',
    secondaryText: 'Avenida Talatona, Talatona',
    address: 'Shopping Avennida, Avenida Talatona, Talatona, Luanda, Angola',
    category: 'Shopping',
    iconType: 'shopping',
    lat: -8.9275,
    lng: 13.1874,
    keywords: ['avennida', 'avenida', 'shopping', 'talatona', 'kero talatona', 'lojas']
  },
  {
    id: 'landmark-largo-mutamba',
    name: 'Largo da Mutamba',
    secondaryText: 'Baixa de Luanda, Ingombota',
    address: 'Largo da Mutamba, Ingombota, Luanda, Angola',
    category: 'Centro Histórico',
    iconType: 'landmark',
    lat: -8.8152,
    lng: 13.2275,
    keywords: ['mutamba', 'largo da mutamba', 'ingombota', 'baixa', 'governo', 'bna']
  },
  {
    id: 'landmark-centralidade-kilamba',
    name: 'Centralidade do Kilamba',
    secondaryText: 'Quarteirões A ao W, Belas',
    address: 'Centralidade do Kilamba, Belas, Luanda, Angola',
    category: 'Centralidade',
    iconType: 'urban',
    lat: -9.0064,
    lng: 13.2758,
    keywords: ['kilamba', 'centralidade', 'quarteirao', 'quarteirões', 'belas', 'kero kilamba']
  },
  {
    id: 'landmark-ilha-de-luanda',
    name: 'Ilha de Luanda (Ponto Final)',
    secondaryText: 'Avenida Murtala Mohamed, Luanda',
    address: 'Ilha de Luanda, Avenida Murtala Mohamed, Luanda, Angola',
    category: 'Praias & Gastronomia',
    iconType: 'landmark',
    lat: -8.7698,
    lng: 13.2458,
    keywords: ['ilha', 'ilha de luanda', 'ponto final', 'murtala mohamed', 'chicala', 'praia', 'peixe em brasa']
  },
  {
    id: 'landmark-memorial-agostinho-neto',
    name: 'Memorial Dr. António Agostinho Neto (Foguetão)',
    secondaryText: 'Praia do Bispo, Luanda',
    address: 'Memorial Dr. António Agostinho Neto, Praia do Bispo, Luanda, Angola',
    category: 'Monumento',
    iconType: 'landmark',
    lat: -8.8251,
    lng: 13.2185,
    keywords: ['memorial', 'agostinho neto', 'foguetao', 'foguetão', 'praia do bispo', 'monumento']
  },
  {
    id: 'landmark-fortaleza-sao-miguel',
    name: 'Fortaleza de São Miguel',
    secondaryText: 'Morro de São Paulo, Ingombota',
    address: 'Fortaleza de São Miguel, Morro de São Paulo, Luanda, Angola',
    category: 'Monumento Histórico',
    iconType: 'landmark',
    lat: -8.8073,
    lng: 13.2225,
    keywords: ['fortaleza', 'sao miguel', 'são miguel', 'morro', 'museu militar', 'ingombota']
  },
  {
    id: 'landmark-largo-kinaxixi',
    name: 'Largo do Kinaxixi',
    secondaryText: 'Ingombota / Maculusso',
    address: 'Largo do Kinaxixi, Luanda, Angola',
    category: 'Ponto Central',
    iconType: 'urban',
    lat: -8.8184,
    lng: 13.2355,
    keywords: ['kinaxixi', 'quinaxixe', 'rainha jinga', 'maculusso', 'ingombota', 'largo']
  },
  {
    id: 'landmark-xyami-nova-vida',
    name: 'Xyami Shopping Nova Vida',
    secondaryText: 'Urbanização Nova Vida, Kilamba Kiaxi',
    address: 'Xyami Shopping Nova Vida, Kilamba Kiaxi, Luanda, Angola',
    category: 'Shopping',
    iconType: 'shopping',
    lat: -8.8821,
    lng: 13.2389,
    keywords: ['xyami', 'nova vida', 'shopping', 'cinema', 'kilamba kiaxi', 'lojas']
  },
  {
    id: 'landmark-xyami-kilamba',
    name: 'Xyami Shopping Kilamba',
    secondaryText: 'Via Expressa / Entrada do Kilamba',
    address: 'Xyami Shopping Kilamba, Via Expressa, Luanda, Angola',
    category: 'Shopping',
    iconType: 'shopping',
    lat: -8.9950,
    lng: 13.2680,
    keywords: ['xyami kilamba', 'via expressa', 'shopping kilamba', 'cinema']
  },
  {
    id: 'landmark-ccta-talatona',
    name: 'Centro de Convenções de Talatona (CCTA)',
    secondaryText: 'Rua Luanda Sul, Talatona',
    address: 'Centro de Convenções de Talatona, Talatona, Luanda, Angola',
    category: 'Eventos & Negócios',
    iconType: 'landmark',
    lat: -8.9242,
    lng: 13.1906,
    keywords: ['ccta', 'talatona', 'convencoes', 'convenções', 'hotel talatona', 'eventos']
  },
  {
    id: 'landmark-estadio-11-novembro',
    name: 'Estádio Nacional 11 de Novembro',
    secondaryText: 'Via Expressa Fidel Castro, Camama',
    address: 'Estádio 11 de Novembro, Via Expressa Fidel Castro, Luanda, Angola',
    category: 'Estádio',
    iconType: 'stadium',
    lat: -8.9747,
    lng: 13.2925,
    keywords: ['estadio', 'estádio', '11 de novembro', 'futebol', 'camama', 'via expressa', 'girabola']
  },
  {
    id: 'landmark-campus-uan',
    name: 'Campus Universitário da UAN',
    secondaryText: 'Cidade Universitária, Camama',
    address: 'Campus Universitário da Universidade Agostinho Neto, Camama, Luanda, Angola',
    category: 'Universidade',
    iconType: 'university',
    lat: -8.9372,
    lng: 13.2755,
    keywords: ['uan', 'campus', 'universidade', 'agostinho neto', 'camama', 'estudantes']
  },
  {
    id: 'landmark-hospital-americo-boavida',
    name: 'Hospital Américo Boavida',
    secondaryText: 'Avenida Deolinda Rodrigues, Rangel',
    address: 'Hospital Geral Américo Boavida, Rangel, Luanda, Angola',
    category: 'Hospital',
    iconType: 'hospital',
    lat: -8.8315,
    lng: 13.2570,
    keywords: ['hospital', 'americo boavida', 'américo boavida', 'rangel', 'deolinda rodrigues', 'urgencia']
  },
  {
    id: 'landmark-clinica-girassol',
    name: 'Clínica Girassol',
    secondaryText: 'Avenida Comandante Gika, Maianga',
    address: 'Clínica Girassol, Avenida Comandante Gika, Maianga, Luanda, Angola',
    category: 'Hospital',
    iconType: 'hospital',
    lat: -8.8310,
    lng: 13.2425,
    keywords: ['girassol', 'clinica', 'clínica', 'maianga', 'comandante gika', 'saude']
  },
  {
    id: 'landmark-palacio-de-ferro',
    name: 'Palácio de Ferro',
    secondaryText: 'Rua das Alfândegas, Baixa de Luanda',
    address: 'Palácio de Ferro, Rua das Alfândegas, Luanda, Angola',
    category: 'Cultura',
    iconType: 'landmark',
    lat: -8.8118,
    lng: 13.2326,
    keywords: ['palacio de ferro', 'palácio de ferro', 'cultura', 'baixa', 'alfandegas', 'eiffel']
  },
  {
    id: 'landmark-maianga-rotunda',
    name: 'Largo da Maianga',
    secondaryText: 'Distrito Urbano da Maianga',
    address: 'Largo da Maianga, Maianga, Luanda, Angola',
    category: 'Zona Urbana',
    iconType: 'urban',
    lat: -8.8315,
    lng: 13.2305,
    keywords: ['maianga', 'largo da maianga', 'rotunda', 'cassenda', 'rocha pinto']
  },
  {
    id: 'landmark-bairro-alvalade',
    name: 'Bairro Alvalade',
    secondaryText: 'Avenida Comandante Gika, Maianga',
    address: 'Bairro Alvalade, Maianga, Luanda, Angola',
    category: 'Zona Urbana',
    iconType: 'urban',
    lat: -8.8378,
    lng: 13.2431,
    keywords: ['alvalade', 'comandante gika', 'maianga', 'praça de alvalade']
  },
  {
    id: 'landmark-viana-vila',
    name: 'Vila de Viana (Estação)',
    secondaryText: 'Município de Viana, Luanda',
    address: 'Vila de Viana, Viana, Luanda, Angola',
    category: 'Município',
    iconType: 'urban',
    lat: -8.9038,
    lng: 13.3664,
    keywords: ['viana', 'vila', 'vila de viana', 'ponte partida', 'estacao de viana', 'zango']
  },
  {
    id: 'landmark-centralidade-sequele',
    name: 'Centralidade do Sequele',
    secondaryText: 'Município de Cacuaco',
    address: 'Centralidade do Sequele, Cacuaco, Luanda, Angola',
    category: 'Centralidade',
    iconType: 'urban',
    lat: -8.7610,
    lng: 13.4420,
    keywords: ['sequele', 'cacuaco', 'centralidade do sequele', 'vila flor']
  },
  {
    id: 'landmark-porto-de-luanda',
    name: 'Porto de Luanda',
    secondaryText: 'Largo 4 de Fevereiro / Baixa',
    address: 'Porto de Luanda, Baixa de Luanda, Angola',
    category: 'Porto & Logística',
    iconType: 'landmark',
    lat: -8.8020,
    lng: 13.2360,
    keywords: ['porto', 'porto de luanda', 'cargas', 'maritimo', 'baixa']
  },
  {
    id: 'landmark-morro-bento-gamek',
    name: 'Morro Bento (Rotunda do Gamek)',
    secondaryText: 'Avenida 21 de Janeiro / Samba',
    address: 'Morro Bento, Rotunda do Gamek, Luanda, Angola',
    category: 'Zona Urbana',
    iconType: 'urban',
    lat: -8.8830,
    lng: 13.1950,
    keywords: ['morro bento', 'gamek', 'rotunda do gamek', '21 de janeiro', 'samba']
  }
];

export function searchLuandaLandmarks(query: string, limit = 6): LuandaLandmark[] {
  if (!query || query.trim() === '') {
    // Return top iconic landmarks when query is empty
    return LUANDA_LANDMARKS.slice(0, limit);
  }

  const cleanQuery = query.toLowerCase().trim();
  const scored = LUANDA_LANDMARKS.map(item => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const secLower = item.secondaryText.toLowerCase();

    if (nameLower === cleanQuery) score += 100;
    else if (nameLower.startsWith(cleanQuery)) score += 60;
    else if (nameLower.includes(cleanQuery)) score += 40;

    if (secLower.includes(cleanQuery)) score += 20;

    const matchedKeyword = item.keywords.some(k => k.toLowerCase().includes(cleanQuery) || cleanQuery.includes(k.toLowerCase()));
    if (matchedKeyword) score += 30;

    return { item, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.item);
}
