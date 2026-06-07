export const LOAN_CATEGORIES = [
  { id: "dinero",       label: "Dinero",       emoji: "💸", placeholder: "¿Para qué fue? Ej: cena del sábado" },
  { id: "libros",       label: "Libros",        emoji: "📚", placeholder: "¿Qué libro? Ej: El nombre del viento" },
  { id: "ropa",         label: "Ropa",          emoji: "👕", placeholder: "¿Qué prenda? Ej: chaqueta vaquera" },
  { id: "herramientas", label: "Herramientas",  emoji: "🔧", placeholder: "¿Qué herramienta? Ej: taladro Bosch" },
  { id: "deporte",      label: "Deporte",       emoji: "🏃", placeholder: "¿Qué material? Ej: bicicleta de montaña" },
  { id: "juegos",       label: "Juegos",        emoji: "🎮", placeholder: "¿Qué juego? Ej: The Last of Us" },
  { id: "hogar",        label: "Hogar",         emoji: "🏠", placeholder: "¿Qué objeto? Ej: aspiradora Dyson" },
  { id: "viaje",        label: "Viaje",         emoji: "✈️", placeholder: "¿Qué prestaste? Ej: maleta de cabina" },
  { id: "mascotas",     label: "Mascotas",      emoji: "🐾", placeholder: "¿Qué prestaste? Ej: transportín grande" },
  { id: "otros",        label: "Otros",         emoji: "📦", placeholder: "¿Qué prestaste? Ej: cámara de fotos" },
] as const;

export type LoanCategory = typeof LOAN_CATEGORIES[number]["id"];
