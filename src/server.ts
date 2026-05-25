import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts: ['*'] });

// Lazy initialized Gemini client to prevent app crash on startup if key is missing/delayed
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not defined. AI endpoints will operate in demo mode.');
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// REST API Endpoints with JSON payload parsing
app.use(express.json());

app.post('/api/ai/describe', async (req, res) => {
  const { productName, category } = req.body;
  const ai = getAi();
  if (!ai) {
    return res.json({ text: `[Démo] Description générée pour le produit "${productName}" dans la catégorie "${category}". (Activez la clé GEMINI_API_KEY pour de vraies descriptions)` });
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'expert marketing pour la marketplace O'CHAP, rédige une description captivante et professionnelle pour un produit nommé "${productName}" dans la catégorie "${category}". La description doit être concise, mettre en avant les bénéfices et inciter à l'achat. Réponse en français pur.`,
    });
    return res.json({ text: response.text || '' });
  } catch (error) {
    console.error('Gemini Describe Error:', error);
    return res.status(500).json({ error: 'Failed to generate description' });
  }
});

app.post('/api/ai/analyze-inventory', async (req, res) => {
  const { productSummary, orderSummary } = req.body;
  const ai = getAi();
  if (!ai) {
    return res.json({ text: `[Démo] Analyse intelligente d'inventaire O'CHAP disponible en activant la clé GEMINI_API_KEY.` });
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse cet inventaire pour la boutique O'CHAP. 
      Produits: ${JSON.stringify(productSummary)}
      Dernières commandes: ${JSON.stringify(orderSummary)}
      Directives: 
      1. Identifie les produits à risque de rupture (en dessous du seuil).
      2. Suggère des réapprovisionnements prioritaires.
      3. Identifie les produits qui ne tournent pas assez.
      4. Donne 3 conseils stratégiques courts pour augmenter les ventes.
      Réponds sous forme de rapport Markdown structuré en français.`,
    });
    return res.json({ text: response.text || '' });
  } catch (error) {
    console.error('Gemini Inventory Error:', error);
    return res.status(500).json({ error: 'Failed to analyze inventory' });
  }
});

app.post('/api/ai/marketing', async (req, res) => {
  const { shortageCount, promoCount } = req.body;
  const ai = getAi();
  if (!ai) {
    return res.json([
      { title: "Campagne Réapprovisionnement", subject: "Stocks bas chez O'CHAP", message: "Profitez de nos nouveaux arrivages avant rupture de stock !", channel: "Email" },
      { title: "Offre Flash d'Afrique", subject: "Bons plans du jour", message: "Profitez de remises exclusives allant jusqu'à 25% à Libreville et Abidjan !", channel: "Push" },
      { title: "Fidélité O'CHAP", subject: "Une surprise exclusive", message: "Merci de faire confiance à O'CHAP pour votre électroménager.", channel: "SMS" }
    ]);
  }
  try {
    const prompt = `
      Agis en tant qu'Expert Marketing pour O'CHAP Afrique.
      Génère 3 idées de campagnes marketing automatisées.
      Contexte : Nous avons ${shortageCount} produits en stock faible et ${promoCount} produits en promotion.
      L'audience est à Abidjan et Libreville.
      Le ton doit être professionnel, premium et dynamique.
      
      Retourne un tableau JSON d'objets : { title: string, subject: string, message: string, channel: "Email" | "SMS" | "Push" }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Gemini Marketing Error:', error);
    return res.status(500).json({ error: 'Failed to run marketing automation' });
  }
});

app.post('/api/ai/analytics', async (req, res) => {
  const { products, ordersCount } = req.body;
  const ai = getAi();
  if (!ai) {
    return res.json({
      globalHealth: 'stable',
      profitAnalysis: '[Démo] Analyse indisponible - la clé GEMINI_API_KEY n\'est pas configurée.',
      topPerformingBrands: ['Samsung', 'LG', 'O\'CHAP Premium'],
      seasonalInsights: '[Démo] Conseils saisonniers en Afrique de l\'Ouest : Anticipez les fortes chaleurs en mettant en avant les congélateurs et climatiseurs.',
      stockAlerts: ['Stock faible sur les réfrigérateurs à Abidjan']
    });
  }
  try {
    const prompt = `
      Analyse les données business pour O'CHAP Afrique (Abidjan/Libreville).
      Données : 
      - Produits: ${JSON.stringify(products)}
      - Commandes: ${ordersCount} commandes récentes.
      
      Génère un rapport analytique structuré en JSON avec les champs suivants :
      - globalHealth: "excellent" | "stable" | "critical"
      - profitAnalysis: string (analyse des marges)
      - topPerformingBrands: string[]
      - seasonalInsights: string (conseils pour la saison actuelle en Afrique)
      - stockAlerts: string[]
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Gemini Analytics Error:', error);
    return res.status(500).json({ error: 'Failed to compile advanced analytics' });
  }
});



/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
