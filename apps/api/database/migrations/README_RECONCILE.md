## Recreated migrations (reconciliation)

These migration files were reconstructed to match the current database state when adonis_schema showed applied migrations that did not have corresponding files in the repository.

Recreated migration files (names match adonis_schema):
- 1810000000000_create_skill_vectors.ts
- 1810000001000_create_gamification_badges.ts
- 1810000002000_create_user_badges.ts
- 1810000003000_create_compliance_logs.ts
- 1810000004000_create_feedback_sentiment.ts
- 1820000000000_add_role_status_to_users.ts
- 1820000001000_add_owner_to_organizations.ts
- 1820000002000_create_tags.ts
- 1820000003000_create_skills.ts
- 1820000004000_create_event_tags.ts
- 1830000000000_add_slug_to_roles.ts

Notes:
- These migration files were reconstructed from the live database schema. They are intended to restore parity between the repository and the DB migration history so future deployments and rollbacks behave consistently.
- These files should not be run against the live DB (they are already applied) — they exist so the source tree reflects the applied migrations.

If you prefer a more exact re-creation (different column types, indexes), we can refine them further by comparing production DDL to the migration code and updating these files accordingly.
