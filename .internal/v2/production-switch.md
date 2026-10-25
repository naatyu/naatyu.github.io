# V2 production switch — 2026-10-25

Nathan approved migrating the reviewed preview to the live site and requested the homepage simplification. Removed the top-left brand and Research.Engineering label;replaced the previous subtitle with Learn→Build→Repeat and a return-arrow mark. Desktop1280×900/mobile390×844 screenshots inspected:no page overflow,no browser warnings/errors. Scientific reader content unchanged.

Remote main matched the local baseline before work. Recovery snapshot committed separately as8ccadb1;all232original bodies now have byte-equal pinned Git recovery. The release also tracks the formerly local harness source as a legacy fixture so a clean clone can run preservation tests;this does not put its body in the deployed artifact. Historical untracked/publication metadata remains provenance,not a claim of past public hosting.

Activated the previously prepared workflow locally:Node24,v2/package-lock.json,npmci,publication packaging test,v2 artifact upload andPages deploy. RootREADME andAGENTS now identify v2 as the publication path. Legacy Docusaurus sources remain unbuilt recovery/test fixtures;no old body is copied into the site. Physical repository cleanup is not part of this live cutover and must not break preservation checks.

Full47-script27189 terminal0 after homepage changes;HTTP23065 terminal0. PublicationvYNXui:54readers,56canonical pages,206compatibility landings,25notices,15media,zero old-content dependencies. Source preflight:232/232Git-equal,zero blocked. Additional final validation after staging/commit is recorded with the actual release hash and deployment result;workflow configuration/push alone does not establish hosted success.
