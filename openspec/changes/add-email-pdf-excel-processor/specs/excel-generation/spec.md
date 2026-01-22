# Excel Generation Specification

## ADDED Requirements

### Requirement: In-Memory Excel Creation
The system SHALL create Excel workbooks in memory using exceljs.

#### Scenario: Create new workbook
- **WHEN** Excel generation is initiated
- **THEN** a new workbook is created in memory

#### Scenario: Manual mode for debugging
- **WHEN** debug.manualExcelCreation is true in config
- **THEN** Excel file is created manually for debugging purposes

### Requirement: Monthly Tab Management
The system SHALL create and manage monthly tabs in the Excel workbook.

#### Scenario: Create base tab
- **WHEN** workbook is initialized
- **THEN** a base template tab is created

#### Scenario: Copy tab for new month
- **WHEN** processing a new month
- **THEN** base tab is copied and modified for that month

#### Scenario: Name tab by month
- **WHEN** a monthly tab is created
- **THEN** tab name reflects the month (e.g., "Enero 2025")

### Requirement: Tab Data Management
The system SHALL provide extensible functions for populating and managing tab data.

#### Scenario: Create base template structure
- **WHEN** a new tab is created
- **THEN** base template with headers and columns is initialized

#### Scenario: Extensible data population
- **WHEN** data needs to be written to Excel
- **THEN** a stub function is available for implementing specific population logic

#### Scenario: Clear tab data for new month
- **WHEN** copying a tab for a new month
- **THEN** data rows are cleared while preserving structure

### Requirement: Excel File Output
The system SHALL save or return the Excel workbook based on configuration.

#### Scenario: Save to file
- **WHEN** processing is complete and not in debug mode
- **THEN** Excel file is saved to configured output path

#### Scenario: Debug mode output
- **WHEN** in debug mode
- **THEN** Excel workbook is available for manual inspection
