/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { BoundingBox } from "../components/FaceDetectionPanel";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- YOU MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Generates an auto-enhanced image using generative AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the enhanced image.
 */
export const generateEnhancedImage = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting auto-enhancement...`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a subtle, professional-grade auto-enhancement to the provided image.
Focus on improving the overall lighting, contrast, and color balance to make the image 'pop' while maintaining a completely photorealistic and natural look.
Do not make any creative or stylistic changes. The enhancement should be subtle and clean, like a professional one-click enhancement tool.

Output: Return ONLY the final enhanced image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and auto-enhance prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for enhancement.', response);
    
    return handleApiResponse(response, 'enhancement');
};

/**
 * Extracts text from an image using generative AI (OCR).
 * @param originalImage The image file to extract text from.
 * @returns A promise that resolves to the extracted text string.
 */
export const extractTextFromImage = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting text extraction (OCR)...`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

    const originalImagePart = await fileToPart(originalImage);
    const prompt = "Extract all text from the image. Provide only the text content, without any additional commentary or formatting.";
    const textPart = { text: prompt };

    console.log('Sending image and OCR prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for text extraction.', response);

    return response.text;
};

/**
 * Detects faces in an image and returns their bounding boxes.
 * @param originalImage The image file to detect faces in.
 * @returns A promise that resolves to an array of bounding boxes.
 */
export const detectFaces = async (
    originalImage: File
): Promise<BoundingBox[]> => {
    console.log(`Starting face detection...`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

    const originalImagePart = await fileToPart(originalImage);
    const prompt = "Analyze the image to find all human faces. For each face, provide a normalized bounding box. The coordinates (x, y) should represent the top-left corner, and all values (x, y, width, height) must be floats between 0.0 and 1.0, relative to the image's total dimensions.";
    const textPart = { text: prompt };

    console.log('Sending image and face detection prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    faces: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER, description: "The normalized horizontal coordinate (from 0.0 to 1.0) of the top-left corner." },
                                y: { type: Type.NUMBER, description: "The normalized vertical coordinate (from 0.0 to 1.0) of the top-left corner." },
                                width: { type: Type.NUMBER, description: "The normalized width (from 0.0 to 1.0) of the bounding box." },
                                height: { type: Type.NUMBER, description: "The normalized height (from 0.0 to 1.0) of the bounding box." }
                            },
                            required: ["x", "y", "width", "height"]
                        }
                    }
                },
                required: ["faces"]
            }
        }
    });

    console.log('Received response from model for face detection.', response);
    
    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        // Validate that coordinates are within the expected 0-1 range
        if (result.faces && Array.isArray(result.faces)) {
            return result.faces.filter((face: BoundingBox) => 
                face.x >= 0 && face.x <= 1 &&
                face.y >= 0 && face.y <= 1 &&
                face.width >= 0 && face.width <= 1 &&
                face.height >= 0 && face.height <= 1
            );
        }
        return [];
    } catch (e) {
        console.error("Failed to parse JSON response for face detection:", e);
        throw new Error("The AI model returned an invalid format for face detection.");
    }
};

/**
 * Removes the background from an image using generative AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the image with the background removed.
 */
export const removeBackground = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting background removal...`);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to accurately identify the main subject(s) in the image and completely remove the background, making it transparent. The output must be a PNG image with a transparent background. Do not alter the subject. Return ONLY the final image.`;
    const textPart = { text: prompt };

    console.log('Sending image and background removal prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for background removal.', response);
    
    return handleApiResponse(response, 'background removal');
};
