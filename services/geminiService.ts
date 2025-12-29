import { GoogleGenAI, Type } from "@google/genai";
import { Business } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * uses gemini-2.5-flash with googleMaps tool to find businesses
 */
export const findBusinesses = async (
  query: string,
  locationHint?: string
): Promise<Business[]> => {
  // Use gemini-2.5-flash for Maps Grounding
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Find businesses matching: "${query}" near ${locationHint || "me"}.
    Use Google Maps to verify they exist.

    After using the tool, output a strictly valid JSON array containing the found businesses.
    Enclose the JSON in a markdown code block (\`\`\`json ... \`\`\`).
    
    Each object in the array must have:
    - name (string)
    - address (string)
    - category (string)
    - rating (number, use 0 if not available)
    - reviewCount (number, use 0 if not available)
    - website (string or null)
    - phoneNumber (string or null)
    - email (string or null - infer if possible, otherwise null)
    - googleMapsUri (string or null)
    - snippet (string, a short summary)
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        // NOTE: responseMimeType and responseSchema are NOT supported with googleMaps tool
      },
    });

    const text = response.text || "";
    // Extract JSON from markdown code block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    
    let businesses: Business[] = [];
    if (jsonMatch) {
        try {
            businesses = JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("Failed to parse JSON from Maps response", e);
            console.log("Raw text:", text);
        }
    }

    // Add unique IDs if missing and sanitize
    return businesses.map((b, i) => ({
        ...b,
        id: `biz-${Date.now()}-${i}`,
        website: (b.website && b.website.toLowerCase() !== 'null') ? b.website : undefined,
        phoneNumber: (b.phoneNumber && b.phoneNumber.toLowerCase() !== 'null') ? b.phoneNumber : undefined,
        email: (b.email && b.email.toLowerCase() !== 'null') ? b.email : undefined,
        googleMapsUri: b.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.address)}`
    }));

  } catch (error) {
    console.error("Error finding businesses:", error);
    return [];
  }
};

interface UserProfile {
  name: string;
  role: string;
}

/**
 * uses gemini-3-flash-preview to generate sales pitch
 */
export const generatePitchAndGap = async (
  business: Business, 
  profile: UserProfile, 
  language: 'ENGLISH' | 'TELUGU_LATIN'
): Promise<{ pitch: string; gap: string }> => {
  const modelId = "gemini-3-flash-preview";
  
  const langInstruction = language === 'TELUGU_LATIN' 
    ? "Write the message in conversational Telugu language but using English script (Transliterated/Phonetic). E.g., 'Namaskaram, nenu...'" 
    : "Write the message in English.";

  const prompt = `
    Act as ${profile.name}, a ${profile.role}.
    
    Target Business:
    Name: ${business.name}
    Category: ${business.category}
    Rating: ${business.rating} (${business.reviewCount} reviews)
    Website: ${business.website || "No website detected"}
    Address: ${business.address}
    Maps Link: ${business.googleMapsUri}

    Task 1: Identify the "Digital Gap". 
    - If they have no website, that's the gap.
    - If they have a low rating (< 4.0), reputation management is the gap.
    - If they have few reviews, visibility is the gap.
    - Otherwise, general growth/SEO is the gap.
    Keep it to 5-10 words.

    Task 2: Write a personalized Sales Pitch.
    - Medium: Short message for WhatsApp or Email.
    - Structure:
      1. Intro: "Hi, this is ${profile.name} - ${profile.role}..."
      2. Observation: Mention something specific about them (e.g., "Found you on Google Maps" or "Saw your reviews").
      3. Value: Gently point out the gap (${business.website ? 'improve visibility' : 'build a website'}) and how you help local businesses.
      4. CTA: Soft ask (e.g. "Free for a quick chat?").
      5. Reference: "I found you here: [Insert Maps Link provided above]"
    - Tone: Friendly, local, humble, non-salesy.
    - Language: ${langInstruction}

    Return the result as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gap: { type: Type.STRING },
            pitch: { type: Type.STRING },
          },
          required: ["gap", "pitch"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating pitch:", error);
    return { gap: "Analysis unavailable", pitch: `Hi, this is ${profile.name}. I'd love to help your business grow. Let's chat!` };
  }
};