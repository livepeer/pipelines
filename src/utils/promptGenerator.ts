const prompts = [
  "Tell me a story about a magical forest",
  "Write a poem about the ocean",
  "Describe a futuristic city",
  "Create a recipe for happiness",
  "Explain how clouds are formed to a 5-year-old",
  // Add more prompts as needed
];

export const generateRandomPrompt = (): string => {
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}; 