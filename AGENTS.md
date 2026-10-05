# vempain-admin-frontend — Agent Guide

Use the checked-in Yarn 4 tooling, preserve shared authentication/API
conventions and snake_case contracts, avoid TypeScript enums, and do not
commit generated build output or local environment files. Run the focused tests
and build after changes.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on tags. ACL checks apply only to resources that explicitly carry an ACL.
