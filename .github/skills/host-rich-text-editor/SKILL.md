---
name: host-rich-text-editor
description: Change how the admin frontend hosts the rich-text editor (RichTextEditor props, dataProviders, embed reporting, page-gallery links from embeds, sanitizers). Use for page editor, publish screen or embed related work.
---

# Hosting the rich-text editor in vempain-admin-frontend

- `src/content/PageEditor.tsx` and `src/content/PagePublish.tsx` are the reference hosts of `RichTextEditor` from
  `@vempain/vempain-rt-editor`; keep them aligned with the library's `AGENTS.integration.md` (props, `dataProviders` callbacks of
  `EmbedDataProviders`, exported helpers).
- Canonical body content is embed-comment HTML (`<!--vps:embed:gallery:7-->`); the editor reports the embeds of the current body through
  `onEmbedsChange`. `galleryIdsFromEmbeds` (`src/tools/pageGalleryTools.ts`) keeps the ids of `gallery` embeds and hero `carousel`
  embeds in body order; the page save sends them as `PageRequest.gallery_ids` (null keeps the links, an empty list clears them). There is no
  separate page-gallery endpoint; `PagePublish.tsx` lists the saved links through `galleryAPI.findListByPage`.
- The page path field is `PagePathInput` (`AutoComplete` fed by `pageAPI.suggestPath`, debounced; the backend answers the shared parent
  path, never a full existing path).
- A new embed type needs the editor library, the renderer library, this host and the website frontend runtime, plus the mirrored docs in
  `vempain-site`; do not add host-specific filtering to the editor itself.
- Sanitize everything rendered from backend HTML with `richTextSecurity`/`urlSecurity`/`footerSecurity`.
- Tests: `src/__tests__/pageGalleryTools.test.ts`, `src/__tests__/PagePathInput.test.tsx`; add a test next to them for new host behaviour.
