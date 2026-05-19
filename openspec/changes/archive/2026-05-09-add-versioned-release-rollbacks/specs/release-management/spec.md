## ADDED Requirements

### Requirement: Versioned releases MUST be recorded
The deployment system MUST create a unique release version for each production deployment and persist release metadata that identifies the deployed version, source revision, deployment time, deployment status, and associated database backup file.

#### Scenario: Successful deployment creates a release record
- **WHEN** an operator runs the production deployment command
- **THEN** the system creates a unique release version identifier
- **THEN** the system stores metadata for that version in a persistent release manifest
- **THEN** the system marks the deployed version as the current release

#### Scenario: Deployment preserves the previous release reference
- **WHEN** a new release is marked as current
- **THEN** the system records the previously current release as the previous release
- **THEN** the rollback workflow can resolve that previous release without manual path lookup

### Requirement: Production deployment MUST create a database backup before switching versions
Before any production deployment applies a new release, the deployment system MUST create a MySQL backup for the current production database and associate that backup with the target release record.

#### Scenario: Deployment backup is created before release switch
- **WHEN** an operator starts a production deployment
- **THEN** the system creates a database dump before building or starting the new release
- **THEN** the system stores the backup in a persistent backup directory
- **THEN** the system records the backup path in the release manifest

#### Scenario: Deployment aborts when backup fails
- **WHEN** the database backup step fails
- **THEN** the system MUST stop the deployment
- **THEN** the system MUST NOT mark a new release as current

### Requirement: Deployment MUST verify service health before completion
The deployment system MUST verify that the application and database are operational before declaring a release successful.

#### Scenario: Deployment succeeds only after health checks pass
- **WHEN** the system finishes starting the target release
- **THEN** it checks container health for the required services
- **THEN** it performs an HTTP request against the configured health endpoint
- **THEN** it marks the release as successful only if all checks pass

#### Scenario: Failed health checks prevent release completion
- **WHEN** any required container health check or HTTP validation fails
- **THEN** the system MUST mark the release as failed
- **THEN** the system MUST leave enough metadata for an operator to run rollback immediately

### Requirement: Operators MUST be able to roll back to a previous or specified release
The deployment tooling MUST provide a rollback command that can restore the previous release by default and can also target a specific recorded release version.

#### Scenario: Default rollback targets the previous release
- **WHEN** an operator runs rollback without specifying a version
- **THEN** the system resolves the previously recorded release from the manifest
- **THEN** the system restarts the application using that release's deployment files

#### Scenario: Explicit rollback targets a named release
- **WHEN** an operator runs rollback with a specific release version
- **THEN** the system validates that the version exists in the release manifest
- **THEN** the system restores the application using that release's deployment files

### Requirement: Rollback MUST support optional database restore
The rollback tooling MUST allow operators to choose whether to restore the database backup associated with the release being rolled back from, and it MUST allow an explicit backup file override when operators need to roll back to an older named release.

#### Scenario: Application-only rollback skips database restore
- **WHEN** an operator runs rollback without enabling database restore
- **THEN** the system switches the application release only
- **THEN** the system leaves the current database contents unchanged

#### Scenario: Full rollback restores the current release backup by default
- **WHEN** an operator runs rollback with database restore enabled
- **THEN** the system locates the backup recorded for the currently active release
- **THEN** the system restores that backup into the production MySQL container before completing the rollback

#### Scenario: Explicit backup file can override the default restore source
- **WHEN** an operator runs rollback with database restore enabled and provides a backup file path
- **THEN** the system uses the provided backup file instead of the current release backup
- **THEN** the system restores that backup before completing the rollback
