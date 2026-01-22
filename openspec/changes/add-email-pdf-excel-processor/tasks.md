# Implementation Tasks

## 1. Configuration Setup
- [ ] 1.1 Create config.ts with sender email filter configuration
- [ ] 1.2 Add SharePoint configuration (siteId, driveId, folderPath, fileName)
- [ ] 1.3 Add debug mode flags (manualExcelCreation, skipUpload)
- [ ] 1.4 Add environment variables documentation

## 2. Email Processing
- [ ] 2.1 Implement filtered email retrieval by sender
- [ ] 2.2 Add date range filtering (month/year)
- [ ] 2.3 Add HTML body extraction from emails

## 3. Email HTML Parsing (FLUJO PRINCIPAL)
- [ ] 3.1 Install and configure Cheerio library
- [ ] 3.2 Implement HTML parsing service with stub for selector logic
- [ ] 3.3 Add error handling for malformed HTML
- [ ] 3.4 Create extensible data structure for parsed results

## 4. PDF Extraction (USO FUTURO)
- [ ] 4.1 Install unpdf library
- [ ] 4.2 Create PDF extraction service with stub function
- [ ] 4.3 Add error handling for corrupted PDFs
- [ ] 4.4 Document function for future use

## 5. Excel Generation
- [ ] 5.1 Install and configure exceljs library
- [ ] 5.2 Implement in-memory Excel workbook creation
- [ ] 5.3 Create base template structure with extensible column definitions
- [ ] 5.4 Add monthly tab creation logic
- [ ] 5.5 Implement tab copying and data clearing
- [ ] 5.6 Add tab naming based on month
- [ ] 5.7 Create stub function for data population logic
- [ ] 5.8 Add manual mode for debugging
- [ ] 5.9 Implement local file save as backup

## 6. SharePoint Upload
- [ ] 6.1 Implement file upload to SharePoint document library
- [ ] 6.2 Add logic to check if file exists and update
- [ ] 6.3 Add error handling for upload failures
- [ ] 6.4 Implement skip upload in debug mode
- [ ] 6.5 Add upload confirmation logging

## 7. CLI Interface
- [ ] 7.1 Install and configure Commander library
- [ ] 7.2 Add --year and --month flags
- [ ] 7.3 Implement default to current month logic
- [ ] 7.4 Add help documentation

## 8. Integration
- [ ] 8.1 Connect email parser, Excel, and SharePoint services in main flow
- [ ] 8.2 Add error handling and logging with ora/ansis
- [ ] 8.3 Add TODO comments for business logic implementation
- [ ] 8.4 Test end-to-end workflow with stub data
- [ ] 8.5 Test SharePoint upload and update scenarios
