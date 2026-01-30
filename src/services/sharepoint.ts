import { msClient } from "../msgraph";
import { config } from "../config";
import "@microsoft/msgraph-sdk-sites";
import "@microsoft/msgraph-sdk-drives";

interface GraphError {
    statusCode?: number;
    code?: string;
    message?: string;
}

/**
 * Ensure folder path exists in SharePoint, creating folders if necessary
 */
async function ensureFolderExists(folderPath: string): Promise<boolean> {
    try {
        const { driveId } = config.sharepoint;
        const segments = folderPath.split('/').filter(s => s.length > 0);
        let currentPath = '';

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const previousPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            
            try {
                const itemPath = `root:/${currentPath}:`;
                await msClient.drives.byDriveId(driveId).items.byDriveItemId(itemPath).get();
            } catch (error) {
                const graphError = error as GraphError;
                const isNotFound = 
                    graphError.statusCode === 404 || 
                    graphError.code === 'itemNotFound' ||
                    graphError.message?.includes('could not be found') ||
                    graphError.message?.includes('not found');
                
                if (isNotFound) {
                    console.log(`  📁 Creando carpeta: ${segment}`);
                    const newFolder = { name: segment, folder: {} };
                    
                    try {
                        if (previousPath === '') {
                            await msClient.drives.byDriveId(driveId).items.byDriveItemId('root').children.post(newFolder);
                        } else {
                            const parentItemPath = `root:/${previousPath}:`;
                            await msClient.drives.byDriveId(driveId).items.byDriveItemId(parentItemPath).children.post(newFolder);
                        }
                    } catch (createError) {
                        const createGraphError = createError as GraphError;
                        console.error(`  ❌ Error creando "${segment}":`, createGraphError.message);
                        throw createError;
                    }
                } else {
                    console.error(`  ❌ Error verificando "${segment}":`, graphError.message);
                    throw error;
                }
            }
        }

        return true;
    } catch (error) {
        const graphError = error as GraphError;
        console.error(`  ❌ Error asegurando carpetas:`, graphError.message || 'Error desconocido');
        return false;
    }
}

/**
 * Download file from SharePoint
 */
export async function downloadFromSharePoint(
    folderPath: string,
    fileName: string
): Promise<Buffer | null> {
    try {
        const { driveId } = config.sharepoint;
        const filePath = `${folderPath}/${fileName}`;
        const itemPath = `root:/${filePath}`;

        // First, get the item info to obtain its ID (required for content download)
        const item = await msClient
            .drives
            .byDriveId(driveId)
            .items
            .byDriveItemId(itemPath)
            .get();

        if (!item?.id) {
            console.log(`  ℹ️  Archivo no encontrado en SharePoint`);
            return null;
        }

        // Now download content using the item ID
        const content = await msClient
            .drives
            .byDriveId(driveId)
            .items
            .byDriveItemId(item.id)
            .content
            .get();

        if (content) {
            console.log(`  ✅ Archivo descargado de SharePoint`);
            return Buffer.from(content);
        }

        return null;
    } catch (error) {
        const graphError = error as GraphError;

        if (graphError.statusCode === 404 || graphError.code === 'itemNotFound') {
            console.log(`  ℹ️  Archivo no existe en SharePoint`);
            return null;
        }

        console.error(`  ⚠️  Error descargando:`, graphError.message || 'Error desconocido');
        return null;
    }
}

/**
 * Upload or update file in SharePoint document library
 */
export async function uploadToSharePoint(
    folderPath: string,
    fileName: string,
    fileBuffer: Buffer
): Promise<boolean> {
    try {
        const { driveId } = config.sharepoint;
        const filePath = `${folderPath}/${fileName}`;

        // Ensure folder structure exists
        const folderExists = await ensureFolderExists(folderPath);
        
        if (!folderExists) {
            throw new Error(`No se pudo crear la estructura de carpetas: ${folderPath}`);
        }

        // Upload file
        const fileSizeMB = fileBuffer.length / (1024 * 1024);
        
        if (fileSizeMB > 4) {
            throw new Error(`Archivo muy grande (${fileSizeMB.toFixed(2)} MB). Máximo 4MB`);
        }

        const uploadPath = `root:/${filePath}:/content`;
        
        // Get authentication token
        const { credential } = await import("../msgraph");
        const token = await credential.getToken("https://graph.microsoft.com/.default");
        
        if (!token) {
            throw new Error('No se pudo obtener el token de autenticación');
        }

        // Upload via HTTP PUT
        const baseUrl = 'https://graph.microsoft.com/v1.0';
        const url = `${baseUrl}/drives/${driveId}/items/${uploadPath}`;
        
        const arrayBuffer = fileBuffer.buffer.slice(
            fileBuffer.byteOffset,
            fileBuffer.byteOffset + fileBuffer.byteLength
        ) as ArrayBuffer;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/octet-stream',
            },
            body: arrayBuffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log(`  ✅ Archivo subido a SharePoint`);
        return true;
    } catch (error) {
        const graphError = error as GraphError;
        console.error(`  ❌ Error subiendo:`, graphError.message || 'Error desconocido');
        throw error;
    }
}

/**
 * Check if file exists in SharePoint
 */
export async function fileExistsInSharePoint(
    folderPath: string,
    fileName: string
): Promise<boolean> {
    try {
        const { driveId } = config.sharepoint;
        const filePath = `${folderPath}/${fileName}`;
        const itemPath = `root:/${filePath}`;
        
        await msClient
            .drives
            .byDriveId(driveId)
            .items
            .byDriveItemId(itemPath)
            .get();

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get file versions from SharePoint
 */
export async function getFileVersions(
    folderPath: string,
    fileName: string
): Promise<unknown[]> {
    try {
        const { driveId } = config.sharepoint;
        const filePath = `${folderPath}/${fileName}`;
        const itemPath = `root:/${filePath}`;
        
        const item = await msClient
            .drives
            .byDriveId(driveId)
            .items
            .byDriveItemId(itemPath)
            .get();

        if (!item?.id) {
            return [];
        }

        const versions = await msClient
            .drives
            .byDriveId(driveId)
            .items
            .byDriveItemId(item.id)
            .versions
            .get();

        return versions?.value || [];
    } catch (error) {
        console.error("Error getting file versions:", error);
        return [];
    }
}
