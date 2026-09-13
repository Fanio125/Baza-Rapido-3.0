import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Baza Rápido API Engine v3.0' });
  });

  // Server-side Ride Fare Calculation Endpoint
  app.post('/api/rides/compare', (req, res) => {
    try {
      const { origin, destination, realDistance } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
      }

      // Calculate distance server-side
      const rad = (x: number) => (x * Math.PI) / 180;
      const R = 6371; // Earth radius in km
      const dLat = rad(destination.lat - origin.lat);
      const dLon = rad(destination.lng - origin.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(origin.lat)) * Math.cos(rad(destination.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculatedDistance = R * c;
      const distance = realDistance !== undefined && realDistance > 0 ? realDistance : Math.max(1, parseFloat(calculatedDistance.toFixed(2)));

      // Rush hour calculation
      const hour = new Date().getHours();
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const rushHourFactor = isRushHour ? 1.25 : 1.0;

      const apps = [
        { id: 'yango', name: 'Yango', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2009_49_11.png', basePrice: 500, pricePerKm: 250, travelTimeFactor: 1.0, waitingTime: 3, carType: 'Económico', rating: 4.8, paymentMethods: ['Dinheiro', 'Cartão'] },
        { id: 'bolt', name: 'Bolt', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_11_50.png', basePrice: 600, pricePerKm: 220, travelTimeFactor: 1.1, waitingTime: 5, carType: 'Ride', rating: 4.6, paymentMethods: ['Dinheiro', 'Multicaixa Express'] },
        { id: 'indrive', name: 'inDrive', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2030%20de%20abr.%20de%202026,%2011_09_28.png', basePrice: 400, pricePerKm: 200, travelTimeFactor: 1.2, waitingTime: 8, carType: 'Conforto', rating: 4.7, paymentMethods: ['Dinheiro'] },
        { id: 'uber', name: 'Uber', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/images%20(3).png', basePrice: 700, pricePerKm: 280, travelTimeFactor: 1.0, waitingTime: 4, carType: 'UberX', rating: 4.5, paymentMethods: ['Cartão', 'Cash'] },
        { id: 'heetch', name: 'Heetch', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2009_57_01.png', basePrice: 450, pricePerKm: 230, travelTimeFactor: 1.15, waitingTime: 6, carType: 'Económico', rating: 4.2, paymentMethods: ['Dinheiro'] },
        { id: 'ugo', name: 'UGO', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_16_42.png', basePrice: 550, pricePerKm: 260, travelTimeFactor: 1.1, waitingTime: 7, carType: 'Normal', rating: 4.3, paymentMethods: ['Dinheiro', 'Unitel Money'] },
        { id: 'tleva', name: "T'Leva", logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/images%20(2).png', basePrice: 800, pricePerKm: 300, travelTimeFactor: 0.95, waitingTime: 4, carType: 'Executivo', rating: 4.9, paymentMethods: ['Multicaixa Express', 'Dinheiro'] },
        { id: 'vambazar', name: 'Vambanzar', logo: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2010_05_42.png', basePrice: 500, pricePerKm: 240, travelTimeFactor: 1.1, waitingTime: 6, carType: 'Normal', rating: 4.4, paymentMethods: ['Unitel Money', 'Dinheiro'] },
        { id: 'anda', name: 'Anda', logo: '/anda_logo.jpg', basePrice: 350, pricePerKm: 190, travelTimeFactor: 0.9, waitingTime: 3, carType: 'Económico / Moto', rating: 4.7, paymentMethods: ['Dinheiro', 'Multicaixa Express', 'Unitel Money'] },
      ];

      const estimates = apps.map(app => {
        const price = Math.round(app.basePrice + (app.pricePerKm * distance * rushHourFactor));
        const travelTime = Math.round((distance * 2.5 * app.travelTimeFactor) + app.waitingTime);
        return {
          appId: app.id,
          name: app.name,
          logo: app.logo,
          price,
          waitingTime: app.waitingTime,
          travelTime,
          carType: app.carType,
          rating: app.rating,
          paymentMethods: app.paymentMethods,
          isCheapest: false,
          isFastest: false,
          isBestRated: false,
        };
      });

      const sortedByPrice = [...estimates].sort((a, b) => a.price - b.price);
      const sortedBySpeed = [...estimates].sort((a, b) => (a.waitingTime + a.travelTime) - (b.waitingTime + b.travelTime));
      const sortedByRating = [...estimates].sort((a, b) => b.rating - a.rating);

      const finalResults = estimates.map(res => ({
        ...res,
        isCheapest: res.appId === sortedByPrice[0]?.appId,
        isFastest: res.appId === sortedBySpeed[0]?.appId,
        isBestRated: res.appId === sortedByRating[0]?.appId,
      })).sort((a, b) => a.price - b.price);

      return res.json({
        distance,
        isRushHour,
        currency: 'Kz',
        results: finalResults,
      });
    } catch (err: any) {
      console.error('Erro na estimativa de viagens:', err);
      return res.status(500).json({ error: 'Erro ao calcular estimativas de tarifas' });
    }
  });

  // Server-side Gemini AI route insights (API key strictly server-side)
  app.post('/api/ai/route-insights', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          insight: 'Dica: Nas horas de ponta em Luanda (07h-09h e 17h-19h), escolha o aplicativo com menor tempo estimado de espera.'
        });
      }

      const { originName, destinationName, distance } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `És o assistente virtual do Baza Rápido em Luanda. Resume em 2 frases curtas a melhor dica de viagem de "${originName || 'Origem'}" para "${destinationName || 'Destino'}" (${distance || 5} km).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ insight: response.text || 'Viagem normal com tráfego típico em Luanda.' });
    } catch (err: any) {
      console.warn('Erro na consulta Gemini server-side:', err.message);
      return res.json({ insight: 'Consulte os aplicativos disponíveis para comparar em tempo real.' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
