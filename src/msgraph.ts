import { ClientSecretCredential } from "@azure/identity";
import { AzureIdentityAuthenticationProvider } from "@microsoft/kiota-authentication-azure";
import { createGraphServiceClient, GraphRequestAdapter } from "@microsoft/msgraph-sdk";
import "@microsoft/msgraph-sdk-sites";
import "@microsoft/msgraph-sdk-drives";
import "@microsoft/msgraph-sdk-users";

// Authentication - Certificado para SharePoint REST API
// En producción: CERTIFICATE_PEM contiene el contenido del certificado
// En desarrollo: lee del archivo local

// Cache para credenciales (inicialización lazy)
let _cachedCredential: ClientSecretCredential | null = null;

export const credential = () => {
  if (!_cachedCredential) {
    _cachedCredential = new ClientSecretCredential(
      Bun.env.MICROSOFT_TENANT_ID!,
      Bun.env.MICROSOFT_CLIENT_ID!,
      Bun.env.MICROSOFT_CLIENT_SECRET!
    );
  }
  return _cachedCredential;
};

// Cache para cliente de Microsoft Graph (inicialización lazy)
let _cachedMsClient: ReturnType<typeof createGraphServiceClient> | null = null;

export const msClient = () => {
  if (!_cachedMsClient) {
    const authProvider = new AzureIdentityAuthenticationProvider(credential(), [
      "https://graph.microsoft.com/.default",
    ]);
    const requestAdapter = new GraphRequestAdapter(authProvider);

    // client
    _cachedMsClient = createGraphServiceClient(requestAdapter);
  }

  return _cachedMsClient;
};
