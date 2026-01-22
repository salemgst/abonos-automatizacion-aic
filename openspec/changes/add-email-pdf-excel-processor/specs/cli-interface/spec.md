# CLI Interface Specification

## ADDED Requirements

### Requirement: Command Line Interface
The system SHALL provide a CLI using Commander for user interaction.

#### Scenario: Run with default current month
- **WHEN** script is executed without parameters
- **THEN** current month and year are used for processing

#### Scenario: Specify year and month
- **WHEN** script is executed with --year 2025 --month 1
- **THEN** January 2025 is used for processing

#### Scenario: Display help information
- **WHEN** script is executed with --help
- **THEN** usage information and available options are displayed

### Requirement: Date Parameter Validation
The system SHALL validate date parameters provided via CLI.

#### Scenario: Valid month range
- **WHEN** --month is between 1 and 12
- **THEN** parameter is accepted

#### Scenario: Invalid month range
- **WHEN** --month is outside 1-12 range
- **THEN** error message is displayed and execution stops

#### Scenario: Valid year format
- **WHEN** --year is a valid 4-digit year
- **THEN** parameter is accepted

### Requirement: Current Date Detection
The system SHALL automatically detect and use the current date when no parameters are provided.

#### Scenario: Default to current month
- **WHEN** no date parameters are provided
- **THEN** system uses current month and year from system date

#### Scenario: Partial date parameters
- **WHEN** only --year is provided
- **THEN** current month is used with specified year

#### Scenario: Month without year
- **WHEN** only --month is provided
- **THEN** current year is used with specified month
