import { extractText } from "unpdf";

export interface ParsedPdfData {
    // Add your specific PDF data structure here
    // Example:
    // field1?: string;
    // field2?: number;
    [key: string]: unknown;
}

export interface PdfData {
    rawText: string;
    parsed: ParsedPdfData | null;
}

/**
 * Extract text from PDF buffer
 * 
 * NOTE: This function is prepared for future use but not currently used in the main flow.
 * 
 * TODO: Implement your specific PDF parsing logic here when needed
 * 
 * @param pdfBuffer - PDF file as Buffer
 * @returns Extracted text and parsed data
 */
export async function extractPdfData(pdfBuffer: Buffer): Promise<PdfData> {
    try {
        const result = await extractText(pdfBuffer);
        
        // extractText returns an object with totalPages and text array
        const text = typeof result === 'string' 
            ? result 
            : Array.isArray(result.text) 
                ? result.text.join('\n') 
                : '';

        // TODO: Implement your specific parsing logic here
        // Example:
        // const lines = text.split('\n');
        // const data = {
        //   field1: lines[0],
        //   field2: lines[1],
        //   // ... extract specific fields
        // };

        return {
            rawText: text,
            parsed: null, // Replace with your extracted data
        };
    } catch (error) {
        console.error("Error extracting PDF data:", error);
        return {
            rawText: "",
            parsed: null,
        };
    }
}

/**
 * Download PDF attachment from email
 * 
 * NOTE: Prepared for future use
 * 
 * @param attachmentId - Attachment ID from Microsoft Graph
 * @param messageId - Message ID
 * @param userId - User ID (default: "me")
 * @returns PDF buffer
 */
export async function downloadPdfAttachment(
    attachmentId: string,
    messageId: string,
    userId: string = "me"
): Promise<Buffer | null> {
    try {
        // TODO: Implement attachment download using Microsoft Graph
        // const attachment = await msClient.users.byUserId(userId)
        //   .messages.byMessageId(messageId)
        //   .attachments.byAttachmentId(attachmentId)
        //   .get();

        console.log("PDF download not implemented yet");
        return null;
    } catch (error) {
        console.error("Error downloading PDF attachment:", error);
        return null;
    }
}
