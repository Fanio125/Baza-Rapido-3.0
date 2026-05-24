export interface TaxiApp {
  id: string;
  name: string;
  logo: string;
  rating: number;
  carType: string;
  basePrice: number;
  pricePerKm: number;
  waitingTime: number; // minutes
  travelTimeFactor: number; // multiplier for travel time
  paymentMethods: string[];
  deeplink: string;
  playStore: string;
  appStore: string;
}

export const TAXI_APPS: TaxiApp[] = [
  {
    id: 'yango',
    name: 'Yango',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2009_49_11.png',
    rating: 4.8,
    carType: 'Econômico',
    basePrice: 500,
    pricePerKm: 250,
    waitingTime: 3,
    travelTimeFactor: 1.0,
    paymentMethods: ['Dinheiro', 'Cartão'],
    deeplink: 'yango://',
    playStore: 'https://play.google.com/store/apps/details?id=com.yandex.taximeter',
    appStore: 'https://apps.apple.com/app/yango/id1437144003',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_11_50.png',
    rating: 4.6,
    carType: 'Ride',
    basePrice: 600,
    pricePerKm: 220,
    waitingTime: 5,
    travelTimeFactor: 1.1,
    paymentMethods: ['Dinheiro', 'Multicaixa Express'],
    deeplink: 'bolt://',
    playStore: 'https://play.google.com/store/apps/details?id=ee.mtakso.client',
    appStore: 'https://apps.apple.com/app/bolt-taxify/id675033630',
  },
  {
    id: 'indrive',
    name: 'inDrive',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2030%20de%20abr.%20de%202026,%2011_09_28.png',
    rating: 4.7,
    carType: 'Conforto',
    basePrice: 400,
    pricePerKm: 200,
    waitingTime: 8,
    travelTimeFactor: 1.2,
    paymentMethods: ['Dinheiro'],
    deeplink: 'indrive://',
    playStore: 'https://play.google.com/store/apps/details?id=sinet.startup.inDriver',
    appStore: 'https://apps.apple.com/app/indriver/id716827007',
  },
  {
    id: 'uber',
    name: 'Uber',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/images%20(3).png',
    rating: 4.5,
    carType: 'UberX',
    basePrice: 700,
    pricePerKm: 280,
    waitingTime: 4,
    travelTimeFactor: 1.0,
    paymentMethods: ['Cartão', 'Cash'],
    deeplink: 'uber://',
    playStore: 'https://play.google.com/store/apps/details?id=com.ubercab',
    appStore: 'https://apps.apple.com/app/uber/id368677368',
  },
  {
    id: 'heetch',
    name: 'Heetch',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2009_57_01.png',
    rating: 4.2,
    carType: 'Econômico',
    basePrice: 450,
    pricePerKm: 230,
    waitingTime: 6,
    travelTimeFactor: 1.15,
    paymentMethods: ['Dinheiro'],
    deeplink: 'heetch://',
    playStore: 'https://play.google.com/store/apps/details?id=com.heetch',
    appStore: 'https://apps.apple.com/app/heetch/id693246618',
  },
  {
    id: 'ugo',
    name: 'UGO',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_16_42.png',
    rating: 4.3,
    carType: 'Normal',
    basePrice: 550,
    pricePerKm: 260,
    waitingTime: 7,
    travelTimeFactor: 1.1,
    paymentMethods: ['Dinheiro', 'Unitel Money'],
    deeplink: 'ugo://',
    playStore: '#',
    appStore: '#',
  },
  {
    id: 'tleva',
    name: "T'Leva",
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/images%20(2).png',
    rating: 4.9,
    carType: 'Executivo',
    basePrice: 800,
    pricePerKm: 300,
    waitingTime: 4,
    travelTimeFactor: 0.95,
    paymentMethods: ['Multicaixa Express', 'Dinheiro'],
    deeplink: 'tleva://',
    playStore: 'https://play.google.com/store/apps/details?id=com.tleva.passenger',
    appStore: 'https://apps.apple.com/ao/app/tleva/id1489654167',
  },
  {
    id: 'vambazar',
    name: 'Vambanzar',
    logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_05_42.png',
    rating: 4.4,
    carType: 'Normal',
    basePrice: 500,
    pricePerKm: 240,
    waitingTime: 6,
    travelTimeFactor: 1.1,
    paymentMethods: ['Unitel Money', 'Dinheiro'],
    deeplink: 'vambazar://',
    playStore: 'https://play.google.com/store/apps/details?id=com.vambazar.passenger',
    appStore: 'https://apps.apple.com/ao/app/vambazar/id1566864147',
  }
];

export const LUANDA_COORDINATES = {
  lat: -8.8390,
  lng: 13.2345
};
