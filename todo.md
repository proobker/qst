Analyze the entire codebase, architecture, database schema, components, routes, API endpoints, state management, and existing implementation before making any changes. Understand current functionality and reuse existing patterns wherever possible.

Enhance the application while preserving all existing features, including authentication, profiles, friendships, quest generation, quest completion, approvals, badges, XP, levels, notifications, and social feeds.

## 1. Tinder-Style Quest Discovery

Replace the current Accept/Reject quest buttons with a true swipe-based experience.

Requirements:

* Swipe right to accept a quest.
* Swipe left to reject a quest.
* Smooth drag and release animations.
* Mobile and desktop support.
* Visual indicators while dragging:

  * ✓ Accept when swiping right.
  * ✕ Reject when swiping left.
* Card stack UI with the next quest partially visible underneath.
* Gesture-based interactions similar to Tinder.
* Keyboard and accessibility support where appropriate.
* Preserve all existing quest generation and quest assignment logic.

## 2. Advanced Post Image Editing

Add a complete image editing system both before publishing and after publishing.

### Before Publishing

Users should be able to:

* Crop images.
* Rotate images.
* Adjust brightness.
* Adjust contrast.
* Adjust saturation.
* Adjust sharpness.
* Apply a curated collection of modern filters.
* Preview edits in real time.
* Save the edited image as the final uploaded image.

### After Publishing

Add an "Edit Post" option available only to the post owner.

Users should be able to:

* Reopen the image editor.
* Modify previously uploaded images.
* Crop images.
* Rotate images.
* Adjust brightness.
* Adjust contrast.
* Adjust saturation.
* Adjust sharpness.
* Apply filters.
* Preview changes before saving.

Requirements:

* Update the existing post rather than creating a new one.
* Preserve likes, approvals, comments, XP rewards, quest completion records, badges, timestamps, and social interactions.
* Display an "Edited" indicator on modified posts.
* Maintain edit history for rollback, moderation, and audit purposes.
* Optimize storage by avoiding unnecessary image duplication.
* Ensure only the post owner can edit their content.

## 3. User Experience Improvements

Improve overall polish and responsiveness.

Requirements:

* Loading states for image processing and uploads.
* Skeleton loaders where appropriate.
* Smooth page transitions and micro-animations.
* Responsive mobile-first layouts.
* Consistent styling across all pages.
* Improved touch interactions.
* Better feedback for uploads, approvals, edits, and quest actions.
* Maintain existing performance standards.

## Before Implementation

1. Review all existing files and architecture.
2. Identify affected components, services, APIs, and database tables.
3. Provide a concise implementation plan.
4. Recommend any new libraries required.
5. Explain potential migration requirements.
6. Avoid breaking changes.
7. Maintain backward compatibility with existing data and user accounts.
8. Follow existing coding standards and project structure.
9. Implement changes incrementally and safely.
