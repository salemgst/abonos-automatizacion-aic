# Email Processing Specification

## ADDED Requirements

### Requirement: Filtered Email Retrieval
The system SHALL retrieve emails from Microsoft 365 filtered by sender email address.

#### Scenario: Retrieve emails from allowed sender
- **WHEN** the system requests emails with sender filter "sender@example.com"
- **THEN** only emails from that sender are returned

#### Scenario: Retrieve emails from current month
- **WHEN** no date parameters are provided
- **THEN** emails from the current month are retrieved

#### Scenario: Retrieve emails from specific month and year
- **WHEN** --year 2025 and --month 1 are provided
- **THEN** emails from January 2025 are retrieved

### Requirement: Attachment Detection
The system SHALL detect PDF attachments for potential future use.

#### Scenario: Email with PDF attachment
- **WHEN** an email contains a PDF attachment
- **THEN** the attachment is identified and logged

#### Scenario: Email without attachments
- **WHEN** an email has no attachments
- **THEN** processing continues normally without error

**Note**: Attachment download is not part of the current flow but detection is available for future use.

### Requirement: Configurable Sender Filter
The system SHALL use a configurable list of allowed sender email addresses.

#### Scenario: Load sender configuration
- **WHEN** the system starts
- **THEN** allowed sender emails are loaded from config.ts

#### Scenario: Multiple allowed senders
- **WHEN** config contains multiple sender emails
- **THEN** emails from any of those senders are retrieved
