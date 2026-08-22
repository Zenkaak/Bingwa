---
name: Imported app previews
description: Preview workflow behavior for repositories imported into a Replit workspace
---

Imported repositories can include valid artifact metadata without having a corresponding managed workflow registered in the current workspace. In that case, configure one preview workflow using the app's package command and an available port.

**Why:** The imported app can be healthy and build successfully while artifact-aware restart/presentation tools cannot find it until a workflow is registered locally.

**How to apply:** Check the workflow list after importing a repository. If it is empty, configure one minimal web workflow, use the port it actually serves on, and verify with logs and an HTTP request before finishing.