"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nsfwCheck_1 = require("./nsfwCheck");
const openai_1 = require("openai");
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
            const expectedIndex = Math.floor(0.5 * nsfwCheck_1.safePrompts.length);
            const result = (0, nsfwCheck_1.getRandomSafePrompt)();
            expect(result).toBe(nsfwCheck_1.safePrompts[expectedIndex]);
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
            openai_1.OpenAI.prototype.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await (0, nsfwCheck_1.isPromptNSFW)("a nude person");
            expect(result.isNSFW).toBe(true);
            expect(result.explanation).toBe("This prompt is trying to generate nudity");
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
            openai_1.OpenAI.prototype.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await (0, nsfwCheck_1.isPromptNSFW)("a cute kitten");
            expect(result.isNSFW).toBe(false);
            expect(result.explanation).toBe("This prompt appears to be safe");
        });
        it("should handle API errors gracefully", async () => {
            // Mock the OpenAI client to throw an error
            openai_1.OpenAI.prototype.chat.completions.create.mockRejectedValue(new Error("API error"));
            const result = await (0, nsfwCheck_1.isPromptNSFW)("test prompt");
            expect(result.isNSFW).toBe(false);
            expect(result.explanation).toBe("Error checking content, allowing by default");
        });
    });
});
