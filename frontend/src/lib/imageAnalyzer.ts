import { GoogleGenerativeAI } from '@google/generative-ai';

// Allowed modest fashion categories
const ALLOWED_MODEST_ITEMS = [
    'abaya', 'hijab', 'thobe', 'kaftan', 'jilbab', 'niqab', 'khimar', 'shayla',
    'modest dress', 'maxi dress', 'long sleeve dress', 'modest gown', 'evening gown',
    'modest blouse', 'long sleeve top', 'tunic', 'modest shirt',
    'long skirt', 'maxi skirt', 'modest pants', 'wide leg pants', 'palazzo pants',
    'modest jacket', 'cardigan', 'kimono', 'coat', 'blazer',
    'scarf', 'shawl', 'wrap', 'prayer dress', 'burkini',
    'men thobe', 'dishdasha', 'kandura', 'jubba', 'kurta',
    'formal wear', 'wedding dress', 'traditional dress',
    'islamic clothing', 'muslim clothing', 'cultural clothing', 'ethnic wear'
];

// Items that are NOT allowed (immodest/revealing)
const PROHIBITED_ITEMS = [
    'bikini', 'swimsuit', 'swimwear', 'lingerie', 'underwear', 'bra',
    'crop top', 'mini skirt', 'short shorts', 'hot pants',
    'low cut', 'revealing', 'see through', 'transparent',
    'sleeveless', 'tank top', 'strapless', 'backless',
    'tight fitting', 'bodycon', 'mini dress', 'party dress revealing'
];

interface AnalysisResult {
    isApproved: boolean;
    detectedItems: string[];
    category: string | null;
    confidence: number;
    reason: string;
    suggestedCategory?: string;
    isModest?: boolean;
}

export async function analyzeImage(base64Image: string): Promise<AnalysisResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('Gemini API key not configured, skipping image analysis');
        return {
            isApproved: true,
            detectedItems: [],
            category: null,
            confidence: 0,
            reason: 'Image analysis skipped - API key not configured'
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use Gemini 2.5 Flash as confirmed by model list
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Remove data URL prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are a content moderation AI for "Kloset Kifayah", a MUSLIM/ISLAMIC MODEST fashion rental marketplace.

Your job is to determine if an uploaded image is appropriate for our platform which ONLY allows modest, Islamic-compliant clothing.

APPROVED items include: ${ALLOWED_MODEST_ITEMS.join(', ')}

STRICTLY PROHIBITED items include: ${PROHIBITED_ITEMS.join(', ')}

MODESTY RULES (clothing must meet these criteria):
- Must cover the body appropriately (arms to wrists, legs to ankles for women's clothing)
- No revealing, tight-fitting, or see-through clothing
- No swimwear, lingerie, or underwear
- Traditional Islamic clothing like abayas, hijabs, thobes is highly preferred
- Men's clothing: thobes, kurtas, modest shirts/pants are allowed
- Women's clothing: must be loose-fitting and cover appropriately

Analyze this image and respond in JSON format ONLY:
{
    "isApproved": true/false,
    "detectedItems": ["list", "of", "items", "detected"],
    "category": "abaya/hijab/thobe/dress/other",
    "confidence": 0.0-1.0,
    "reason": "Clear explanation - if rejected, explain WHY it violates modest dress guidelines. If approved, explain why it fits.",
    "isModest": true/false
}

BE STRICT: If the item is revealing, tight-fitting, or inappropriate for a Muslim modest fashion marketplace, REJECT IT with isApproved: false and explain why.

Examples of what to REJECT:
- Bikinis, swimsuits → "This is swimwear which is not appropriate for our modest fashion marketplace"
- Crop tops → "This reveals the midriff which does not meet modest dress requirements"
- Mini skirts → "This is too short and does not meet modest dress length requirements"
- Sleeveless dresses → "This does not cover the arms as required for modest clothing"
- Tight bodycon dresses → "This is too form-fitting for modest fashion standards"
- Tank tops → "This is sleeveless and does not meet modest dress requirements"`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            }
        ]);

        const responseText = result.response.text();
        console.log('Gemini API response:', responseText);

        // Clean up response text (remove markdown code blocks)
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Extract JSON from response
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    isApproved: parsed.isApproved ?? false,
                    detectedItems: parsed.detectedItems ?? [],
                    category: parsed.category ?? null,
                    confidence: parsed.confidence ?? 0.8,
                    reason: parsed.reason ?? 'Analysis complete',
                    suggestedCategory: parsed.category,
                    isModest: parsed.isModest ?? false
                };
            } catch (e) {
                console.error('Failed to parse JSON from Gemini response:', e);
            }
        }

        // Default to rejected if parsing fails for safety
        console.error('Could not parse valid JSON from response');
        return {
            isApproved: false,
            detectedItems: [],
            category: null,
            confidence: 0,
            reason: 'Could not analyze image - technical error'
        };

    } catch (error: any) {
        console.error('Image analysis error:', error);
        console.error('Error details:', error.message);

        // Return more helpful error message
        return {
            isApproved: false,
            detectedItems: [],
            category: null,
            confidence: 0,
            reason: `Analysis error: ${error.message || 'Unknown error'}`
        };
    }
}

export type { AnalysisResult };
