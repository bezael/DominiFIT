/**
 * Productos de Suplementos con Enlaces de Afiliados de Amazon
 * 
 * IMPORTANTE: Reemplaza "TU-TAG-AFILIADO" con tu tag de afiliado de Amazon
 * Formato del enlace: https://amazon.es/dp/ASIN?tag=TU-TAG-AFILIADO
 */

export interface Supplement {
  id: string;
  name: string;
  category: "protein" | "creatine" | "vitamins" | "pre-workout" | "recovery" | "other";
  description: string;
  benefits: string[];
  asin: string; // Amazon Standard Identification Number
  imageUrl?: string;
  price?: string;
  rating?: number;
  affiliateLink: string; // Link con tag de afiliado
}

// Reemplaza "TU-TAG-AFILIADO" con tu tag de afiliado de Amazon
const AMAZON_AFFILIATE_TAG = "TU-TAG-AFILIADO";

function createAffiliateLink(asin: string): string {
  return `https://amazon.es/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

export const supplements: Supplement[] = [
  // CREATINA
  {
    id: "creatine-monohydrate-1",
    name: "Creatina Monohidrato",
    category: "creatine",
    description: "Suplemento de creatina monohidrato pura, ideal para aumentar la fuerza y masa muscular.",
    benefits: [
      "Aumenta la fuerza y potencia muscular",
      "Mejora el rendimiento en ejercicios de alta intensidad",
      "Acelera la recuperación entre series",
      "Aumenta la masa muscular magra"
    ],
    asin: "B00H8C1GXK", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B00H8C1GXK"),
    rating: 4.5
  },
  {
    id: "creatine-monohydrate-2",
    name: "Creatina Monohidrato Micronizada",
    category: "creatine",
    description: "Creatina micronizada para mejor absorción y digestión.",
    benefits: [
      "Mejor absorción gracias a la micronización",
      "Menos problemas digestivos",
      "Mayor biodisponibilidad"
    ],
    asin: "B07XYZ1234", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B07XYZ1234"),
    rating: 4.7
  },

  // PROTEÍNA
  {
    id: "whey-protein-1",
    name: "Proteína Whey",
    category: "protein",
    description: "Proteína de suero de leche de alta calidad, ideal para después del entrenamiento.",
    benefits: [
      "Alto contenido de proteína (20-25g por servicio)",
      "Rápida absorción post-entrenamiento",
      "Contiene aminoácidos esenciales",
      "Ayuda en la recuperación muscular"
    ],
    asin: "B08ABC5678", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B08ABC5678"),
    rating: 4.6
  },
  {
    id: "vegan-protein-1",
    name: "Proteína Vegana",
    category: "protein",
    description: "Proteína vegetal para dietas veganas o vegetarianas.",
    benefits: [
      "100% vegetal",
      "Sin lactosa",
      "Alto contenido proteico",
      "Fácil digestión"
    ],
    asin: "B09DEF9012", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B09DEF9012"),
    rating: 4.4
  },

  // VITAMINAS Y MINERALES
  {
    id: "multivitamin-1",
    name: "Multivitamínico Completo",
    category: "vitamins",
    description: "Complejo multivitamínico con minerales esenciales para el rendimiento deportivo.",
    benefits: [
      "Aporta vitaminas y minerales esenciales",
      "Soporta el sistema inmunológico",
      "Mejora los niveles de energía",
      "Ayuda en la recuperación"
    ],
    asin: "B10GHI3456", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B10GHI3456"),
    rating: 4.5
  },
  {
    id: "vitamin-d-1",
    name: "Vitamina D3",
    category: "vitamins",
    description: "Suplemento de vitamina D3 para mantener niveles óptimos.",
    benefits: [
      "Fortalece los huesos",
      "Mejora la función muscular",
      "Soporta el sistema inmunológico",
      "Mejora el estado de ánimo"
    ],
    asin: "B11JKL7890", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B11JKL7890"),
    rating: 4.6
  },

  // PRE-WORKOUT
  {
    id: "pre-workout-1",
    name: "Pre-Entrenamiento",
    category: "pre-workout",
    description: "Suplemento pre-entrenamiento con cafeína y beta-alanina para máximo rendimiento.",
    benefits: [
      "Aumenta la energía y concentración",
      "Mejora el rendimiento durante el entrenamiento",
      "Reduce la fatiga",
      "Aumenta la resistencia"
    ],
    asin: "B12MNO1234", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B12MNO1234"),
    rating: 4.4
  },

  // RECUPERACIÓN
  {
    id: "bcaa-1",
    name: "BCAA (Aminoácidos de Cadena Ramificada)",
    category: "recovery",
    description: "Aminoácidos esenciales para la recuperación y construcción muscular.",
    benefits: [
      "Reduce el dolor muscular post-entrenamiento",
      "Acelera la recuperación",
      "Previene la degradación muscular",
      "Mejora el rendimiento en entrenamientos largos"
    ],
    asin: "B13PQR5678", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B13PQR5678"),
    rating: 4.5
  },
  {
    id: "magnesium-1",
    name: "Magnesio",
    category: "recovery",
    description: "Suplemento de magnesio para mejorar la recuperación y el sueño.",
    benefits: [
      "Mejora la calidad del sueño",
      "Reduce los calambres musculares",
      "Ayuda en la relajación muscular",
      "Soporta la función nerviosa"
    ],
    asin: "B14STU9012", // Ejemplo - reemplaza con ASIN real
    affiliateLink: createAffiliateLink("B14STU9012"),
    rating: 4.6
  }
];

/**
 * Obtiene suplementos por categoría
 */
export function getSupplementsByCategory(category: Supplement["category"]): Supplement[] {
  return supplements.filter(s => s.category === category);
}

/**
 * Obtiene todos los suplementos recomendados según el objetivo del usuario
 */
export function getRecommendedSupplements(goal: "fat-loss" | "muscle" | "maintain" | "performance"): Supplement[] {
  const recommendations: { [key: string]: Supplement["category"][] } = {
    "fat-loss": ["protein", "vitamins", "recovery"],
    "muscle": ["protein", "creatine", "recovery", "vitamins"],
    "maintain": ["vitamins", "recovery"],
    "performance": ["creatine", "pre-workout", "recovery", "protein"]
  };

  const categories = recommendations[goal] || [];
  return supplements.filter(s => categories.includes(s.category));
}
