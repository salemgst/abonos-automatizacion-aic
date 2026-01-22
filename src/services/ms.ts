import "@microsoft/msgraph-sdk-sites";
import "@microsoft/msgraph-sdk-drives";
import "@microsoft/msgraph-sdk-users";

import { msClient } from "../msgraph";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type { Message } from "@microsoft/microsoft-graph-types";

// Microsoft Graph collection response with pagination
interface MessageCollectionResponse {
    value?: Message[];
    "@odata.nextLink"?: string;
}

// Get emails filtered by sender and date range
export async function getFilteredEmails(
    allowedSenders: string[],
    year: number,
    month: number,
    userId: string = "me"
): Promise<Message[]> {
    // Create date range for the specified month
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Format dates for Microsoft Graph filter (UTC)
    const startDateStr = format(startDate, "yyyy-MM-dd'T'00:00:00'Z'");
    const endDateStr = format(endDate, "yyyy-MM-dd'T'23:59:59'Z'");

    console.log(`  🔍 Buscando correos entre ${startDateStr} y ${endDateStr}`);

    // Simplified filter: only date range (filter senders in memory)
    // This avoids "InefficientFilter" error from complex OR conditions
    const filter = `receivedDateTime ge ${startDateStr} and receivedDateTime le ${endDateStr}`;

    // Fetch all messages with pagination
    const allMessages: Message[] = [];
    let nextLink: string | undefined;
    let pageCount = 0;

    do {
        const response = await msClient.users.byUserId(userId).messages.get({
            queryParameters: {
                filter,
                select: ["subject", "from", "receivedDateTime", "body", "hasAttachments"],
                orderby: ["receivedDateTime DESC"],
                top: 999, // Maximum per page
            }
        }) as MessageCollectionResponse;

        const messages = response?.value || [];
        allMessages.push(...messages);
        pageCount++;

        // Check if there are more pages
        nextLink = response["@odata.nextLink"];
        
        console.log(`  📄 Página ${pageCount}: ${messages.length} correos (Total acumulado: ${allMessages.length})`);

        // If there's a next link, fetch the next page
        if (nextLink) {
            console.log(`  ⏭️  Hay más correos, obteniendo siguiente página...`);
            // Note: Microsoft Graph SDK should handle pagination automatically
            // but we're doing it manually to have more control
        }

    } while (nextLink);

    console.log(`  ✅ Total de correos obtenidos: ${allMessages.length}`);

    // Filter by allowed senders in memory
    const filteredMessages = allMessages.filter(message => {
        const fromAddress = message.from?.emailAddress?.address?.toLowerCase() || "";
        return allowedSenders.some(sender =>
            fromAddress.includes(sender.toLowerCase())
        );
    });

    console.log(`  ✅ Correos filtrados por remitente: ${filteredMessages.length}`);

    return filteredMessages;
}

// Leer los últimos 10 correos de la bandeja de entrada
export async function getInboxEmails(userId: string = "me") {
    const messages = await msClient.users.byUserId(userId).mailFolders.byMailFolderId("inbox").messages.get({
        queryParameters: {
            top: 10,
            select: ["subject", "from", "receivedDateTime", "bodyPreview", "isRead"],
            orderby: ["receivedDateTime DESC"]
        }
    });

    return messages?.value || [];
}

// Enviar un correo simple
export async function sendEmail(
    to: string,
    subject: string,
    body: string,
    userId: string = "me"
) {
    await msClient.users.byUserId(userId).sendMail.post({
        message: {
            subject,
            body: {
                contentType: "text",
                content: body
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ]
        }
    });
}

// Marcar un correo como leído
export async function markAsRead(messageId: string, userId: string = "me") {
    await msClient.users.byUserId(userId).messages.byMessageId(messageId).patch({
        isRead: true
    });
}