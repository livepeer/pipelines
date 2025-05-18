// constants.ts

export interface Preset {
    id: string;
    name: string;
    icon: string;
  } 
  
  // Style presets
  export const presets: Preset[] = [
    { id: "none", name: "None", icon: "" },
    { id: "comic", name: "Comic", icon: "💥" },
    { id: "vintage", name: "Vintage", icon: "🎞️" },
    { id: "anime", name: "Anime", icon: "🌸" },
    { id: "fantasy", name: "Fantasy", icon: "🧙" },
    { id: "scifi", name: "Sci-Fi", icon: "🚀" },
    { id: "horror", name: "Horror", icon: "👻" },
    { id: "samurai", name: "Samurai", icon: "⚔️" },
    { id: "animal", name: "Animal", icon: "🦁" },
    { id: "nature", name: "Nature", icon: "🌿" },
    { id: "cyberpunk", name: "Cyberpunk", icon: "🤖" },
    { id: "pop-art", name: "Pop Art", icon: "🎨" },
    { id: "watercolor", name: "Watercolor", icon: "💧" },
    { id: "noir", name: "Noir", icon: "🌑" },
  ];
  
  export interface TrendsResponse {
    trends: { trend: string }[];
  }
  
  
  export const fallbackData: TrendsResponse = {
    trends: [
      { trend: "GTA 6" },
      { trend: "Ed Martin" },
      { trend: "Vice City" },
      { trend: "Carney" },
      { trend: "Rockstar" },
      { trend: "Houthis" },
      { trend: "Tillis" },
      { trend: "Antifa" },
      { trend: "Boasberg" },
      { trend: "Primary" },
      { trend: "Never Say Never" },
      { trend: "GTA VI" },
      { trend: "Lucia" },
      { trend: "RINO" },
      { trend: "Bennett" },
      { trend: "Gulf of Mexico" },
      { trend: "Real ID" },
      { trend: "Merrick Garland" },
      { trend: "Taco Tuesday" },
      { trend: "#tuesdayvibe" },
    ],
  };
  