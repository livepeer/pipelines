import {
  checkPromptForNudity,
  getRandomSafePrompt,
  safePrompts,
} from "./nudityCheck";
import { OpenAI } from "openai";

// Mock the OpenAI class
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
    }),
  };
});

describe("nudityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRandomSafePrompt", () => {
    // Save the original Math object
    const originalMath = global.Math;

    afterEach(() => {
      // Restore the original Math object after the test
      global.Math = originalMath;
    });

    it("should return a random prompt from the safePrompts array", () => {
      // Mock Math.random to return a predictable value
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.5;
      global.Math = mockMath;

      const expectedIndex = Math.floor(0.5 * safePrompts.length);
      const result = getRandomSafePrompt();

      expect(result).toBe(safePrompts[expectedIndex]);
    });
  });

  describe("checkPromptForNudity", () => {
    it('should return true when the API response contains "true"', async () => {
      // Mock the OpenAI response
      const mockResponse = {
        choices: [
          {
            message: {
              content: "true This prompt is trying to generate nudity",
            },
          },
        ],
      };

      (OpenAI.prototype.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const result = await checkPromptForNudity("a nude person");

      expect(result.containsNudity).toBe(true);
      expect(result.explanation).toBe(
        "This prompt is trying to generate nudity",
      );
    });

    it('should return false when the API response contains "false"', async () => {
      // Mock the OpenAI response
      const mockResponse = {
        choices: [
          {
            message: {
              content: "false This prompt appears to be safe",
            },
          },
        ],
      };

      (OpenAI.prototype.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const result = await checkPromptForNudity("a cute kitten");

      expect(result.containsNudity).toBe(false);
      expect(result.explanation).toBe("This prompt appears to be safe");
    });

    it("should handle API errors gracefully", async () => {
      // Mock the OpenAI client to throw an error
      (OpenAI.prototype.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );

      const result = await checkPromptForNudity("test prompt");

      expect(result.containsNudity).toBe(false);
      expect(result.explanation).toBe(
        "Error checking content, allowing by default",
      );
    });
  });
});
