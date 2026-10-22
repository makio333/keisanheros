# Company PC Handoff

For work on legacy save export, facility migration, or the product release, read
`COMPANY_PC_HANDOFF.md` before making changes. It records the branch roles,
verified state, outstanding work, and the required migration sequence.

Preserve company-local changes and the currently serving Firebase connection.
Do not merge the product branch into the legacy deployment or change database
rules as a shortcut. Do not deploy until the operator approves the exact target.
Never commit exported saves, child information, secret environment files, or
credentials. Use fixture data for tests. A GitHub push does not mean deployment
or migration has been completed.
