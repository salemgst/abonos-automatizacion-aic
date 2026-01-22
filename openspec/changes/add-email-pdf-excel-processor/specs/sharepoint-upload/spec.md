# SharePoint Upload Specification

## ADDED Requirements

### Requirement: Excel File Upload
The system SHALL upload generated Excel files to SharePoint document library.

#### Scenario: Upload new file
- **WHEN** Excel is generated and file doesn't exist in SharePoint
- **THEN** file is uploaded to configured library and folder

#### Scenario: Update existing file
- **WHEN** Excel is generated and file already exists in SharePoint
- **THEN** existing file is replaced with new version

#### Scenario: Preserve file history
- **WHEN** file is updated in SharePoint
- **THEN** previous version is preserved in version history

### Requirement: SharePoint Configuration
The system SHALL use configurable SharePoint site and library settings.

#### Scenario: Load SharePoint configuration
- **WHEN** system starts
- **THEN** SharePoint site ID, drive ID, and folder path are loaded from config

#### Scenario: Validate configuration
- **WHEN** upload is attempted
- **THEN** configuration is validated before upload

### Requirement: Upload Error Handling
The system SHALL handle upload errors gracefully.

#### Scenario: Network error during upload
- **WHEN** network error occurs during upload
- **THEN** error is logged and local backup is preserved

#### Scenario: Permission error
- **WHEN** insufficient permissions for upload
- **THEN** error is logged with permission details

#### Scenario: Invalid SharePoint path
- **WHEN** configured path doesn't exist
- **THEN** error is logged with path details

### Requirement: Debug Mode Skip Upload
The system SHALL allow skipping upload in debug mode.

#### Scenario: Skip upload in debug mode
- **WHEN** debug.skipUpload is true
- **THEN** Excel is saved locally only without SharePoint upload

#### Scenario: Local backup
- **WHEN** upload succeeds
- **THEN** local backup copy is also saved to configured path
