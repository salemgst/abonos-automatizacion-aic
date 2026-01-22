import { ClientSecretCredential } from "@azure/identity";
import { AzureIdentityAuthenticationProvider } from "@microsoft/kiota-authentication-azure";
import {
    createGraphServiceClient,
    GraphRequestAdapter,
} from "@microsoft/msgraph-sdk";
import "@microsoft/msgraph-sdk-sites";
import "@microsoft/msgraph-sdk-drives";
import "@microsoft/msgraph-sdk-users";

// Authentication - Certificado para SharePoint REST API
// En producción: CERTIFICATE_PEM contiene el contenido del certificado
// En desarrollo: lee del archivo local
const getCredential = () => {
    const credential = new ClientSecretCredential(
        Bun.env.MICROSOFT_TENANT_ID!,
        Bun.env.MICROSOFT_CLIENT_ID!,
        Bun.env.MICROSOFT_CLIENT_SECRET!
    );

    return credential;
};

export const credential = getCredential();

const getMsClient = () => {
    const authProvider = new AzureIdentityAuthenticationProvider(credential, [
        "https://graph.microsoft.com/.default",
    ]);
    const requestAdapter = new GraphRequestAdapter(authProvider);

    // client
    const msClient = createGraphServiceClient(requestAdapter);

    return msClient;
};

export const msClient = getMsClient();
