/**
 * Script to identify SharePoint Site ID and Document Library Drive ID
 * 
 * Usage:
 *   bun run scripts/get-sharepoint-ids.ts [site-name] [library-name]
 *   bun run scripts/get-sharepoint-ids.ts "ASISTENCIA AIC"
 *   bun run scripts/get-sharepoint-ids.ts "ASISTENCIA AIC" "Documents"
 * 
 * This script will:
 * 1. List all SharePoint sites
 * 2. Find the target site by name
 * 3. List all drives (document libraries) in that site
 * 4. Display the IDs needed for configuration
 */

import { msClient } from "../src/msgraph";
import { parseArgs } from "node:util";
import * as readline from "node:readline";

// Parse command line arguments
const args = process.argv.slice(2);
let TARGET_SITE_NAME = args[0] || ""; // Name of your SharePoint site
const TARGET_LIBRARY_NAME = args[1] || "Documents"; // Name of your document library (usually "Documents")

/**
 * Prompt user for input
 */
async function promptUser(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

interface SiteInfo {
    id?: string;
    displayName?: string;
    webUrl?: string;
    name?: string;
}

interface DriveInfo {
    id?: string;
    name?: string;
    description?: string;
    driveType?: string;
    webUrl?: string;
}

async function main() {
    try {
        console.log("🔍 Buscando sitios de SharePoint...\n");

        // Get all sites
        const sitesResponse = await msClient.sites.getAllSites.get();
        
        if (!sitesResponse?.value || sitesResponse.value.length === 0) {
            throw new Error("No se encontraron sitios de SharePoint");
        }

        console.log(`✅ Se encontraron ${sitesResponse.value.length} sitios\n`);

        // List all sites first
        console.log("📋 Sitios disponibles:");
        const availableSites: SiteInfo[] = [];
        
        for (const site of sitesResponse.value) {
            const siteInfo = site as SiteInfo;
            availableSites.push(siteInfo);
            console.log(`  ${availableSites.length}. ${siteInfo.displayName || siteInfo.name || 'Sin nombre'}`);
            console.log(`     ID: ${siteInfo.id}`);
            console.log(`     URL: ${siteInfo.webUrl}\n`);
        }

        // If no site name provided, ask user
        if (!TARGET_SITE_NAME) {
            console.log("\n" + "=".repeat(70));
            TARGET_SITE_NAME = await promptUser("Ingresa el nombre del sitio de SharePoint: ");
            console.log("=".repeat(70) + "\n");
            
            if (!TARGET_SITE_NAME) {
                throw new Error("Debes proporcionar el nombre del sitio");
            }
        }

        // Find target site
        let targetSite: SiteInfo | null = null;
        
        for (const siteInfo of availableSites) {
            if (siteInfo.displayName === TARGET_SITE_NAME || siteInfo.name === TARGET_SITE_NAME) {
                targetSite = siteInfo;
                break;
            }
        }

        if (!targetSite || !targetSite.id) {
            throw new Error(`No se encontró el sitio "${TARGET_SITE_NAME}"`);
        }

        console.log(`\n✅ Sitio encontrado: ${targetSite.displayName || targetSite.name}`);
        console.log(`📌 Site ID: ${targetSite.id}\n`);

        // Get drives (document libraries) for the site
        console.log("🔍 Buscando bibliotecas de documentos...\n");
        
        const drivesResponse = await msClient.sites.bySiteId(targetSite.id).drives.get();
        
        if (!drivesResponse?.value || drivesResponse.value.length === 0) {
            throw new Error("No se encontraron bibliotecas de documentos en el sitio");
        }

        console.log(`✅ Se encontraron ${drivesResponse.value.length} bibliotecas\n`);

        // List all drives
        let targetDrive: DriveInfo | null = null;
        
        console.log("📋 Bibliotecas disponibles:");
        for (const drive of drivesResponse.value) {
            const driveInfo = drive as DriveInfo;
            console.log(`  - ${driveInfo.name || 'Sin nombre'}`);
            console.log(`    ID: ${driveInfo.id}`);
            console.log(`    Tipo: ${driveInfo.driveType}`);
            console.log(`    Descripción: ${driveInfo.description || 'N/A'}`);
            console.log(`    URL: ${driveInfo.webUrl}\n`);
            
            if (driveInfo.name === TARGET_LIBRARY_NAME) {
                targetDrive = driveInfo;
            }
        }

        if (!targetDrive || !targetDrive.id) {
            console.log(`⚠️  No se encontró la biblioteca "${TARGET_LIBRARY_NAME}" específicamente`);
            console.log(`   Puedes usar cualquiera de las bibliotecas listadas arriba\n`);
        } else {
            console.log(`\n✅ Biblioteca encontrada: ${targetDrive.name}`);
            console.log(`📌 Drive ID: ${targetDrive.id}\n`);
        }

        // Display configuration summary
        console.log("\n" + "=".repeat(70));
        console.log("📝 CONFIGURACIÓN PARA src/config.ts");
        console.log("=".repeat(70) + "\n");
        
        console.log("sharepoint: {");
        console.log(`    siteId: "${targetSite.id}",`);
        
        if (targetDrive) {
            console.log(`    driveId: "${targetDrive.id}",`);
        } else {
            console.log(`    driveId: "SELECCIONA_UNO_DE_LOS_IDS_DE_ARRIBA",`);
        }
        
        console.log(`    basePath: "Documents/CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS",`);
        console.log("    // ... resto de la configuración");
        console.log("}\n");

        console.log("✅ Script completado exitosamente");

    } catch (error) {
        const err = error as { message?: string; statusCode?: number };
        console.error("\n❌ Error:", err.message || "Error desconocido");
        
        if (err.statusCode === 401 || err.statusCode === 403) {
            console.error("\n⚠️  Error de autenticación. Verifica:");
            console.error("   - Las credenciales en el archivo .env");
            console.error("   - Los permisos de la aplicación en Azure AD");
            console.error("   - Permisos necesarios: Sites.Read.All, Files.Read.All");
        }
        
        process.exit(1);
    }
}

// Run the script
main();
