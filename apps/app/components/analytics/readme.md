# Analytics Components

This directory contains reusable components and hooks for tracking user interactions within the application. These tools help maintain consistent analytics collection across the platform.

## Available Components

### TrackedButton

A drop-in replacement for the standard Button component that automatically tracks click events.

```tsx
import { TrackedButton } from "@/components/analytics/TrackedButton";

<TrackedButton
  trackingEvent="my_button_clicked"
  trackingProperties={{
    custom_property: "value",
    location: "header"
  }}
  variant="ghost"
  size="sm"
  onClick={handleClick}
>
  Click Me
</TrackedButton>
```

### TrackedInput

A wrapper around the standard Input component that can track focus, blur, change, and submit events.

```tsx
import { TrackedInput } from "@/components/analytics/TrackedInput";

<TrackedInput
  trackingEvent="search_input"
  trackingProperties={{ location: "header" }}
  trackingOptions={{
    debounceMs: 1000, // Default: 500ms
    trackChange: true, // Default: false
    trackFocus: true, // Default: false
    trackBlur: true, // Default: false
    trackSubmit: true // Default: true
  }}
  placeholder="Search..."
  onTrackSubmit={(value) => {
    // Handle the submitted value
    console.log(`Search submitted: ${value}`);
  }}
/>
```

### TrackedLink

A component that wraps both Next.js Link component and regular anchor tags, automatically handling internal vs external links.

```tsx
import { TrackedLink } from "@/components/analytics/TrackedLink";

{/* Internal link (uses Next.js Link) */}
<TrackedLink
  href="/dashboard"
  trackingEvent="dashboard_link_clicked"
  trackingProperties={{ location: "sidebar" }}
>
  Dashboard
</TrackedLink>

{/* External link (renders as anchor) */}
<TrackedLink
  href="https://example.com"
  trackingEvent="external_link_clicked"
  trackingProperties={{ destination: "example" }}
  isExternal={true}
>
  External Link
</TrackedLink>
```

### PageViewTracker

Add this component to any page to track page views.

```tsx
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

// In your page component
return (
  <>
    <PageViewTracker
      eventName="dashboard_page_view"
      properties={{ referrer: document.referrer }}
    />
    <DashboardContent />
  </>
);
```

## Generic Tracking Hooks

### useTrackEvent

For custom components or complex interaction patterns:

```tsx
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { CustomComponent } from "some-library";

function TrackedCustomComponent() {
  const { onClick, onMouseEnter, onChange, onFocus, onSubmit, trackAction } = useTrackEvent(
    "custom_component_interaction",
    { component_type: "special_widget" }
  );

  // Track custom actions not covered by standard handlers
  const handleSpecialAction = () => {
    trackAction("special_action", { action_detail: "custom interaction" });
  };

  return (
    <CustomComponent
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onChange={onChange}
      onSpecialAction={handleSpecialAction}
    />
  );
}
```

```tsx
import { SomeCustomComponent } from "some-library";

function TrackedThirdPartyComponent() {
  const { onClick, onChange } = useTrackEvent(
    "event_name_interaction_or_whatever",
    { whatevr_data: whatever_data }
  );

  return (
    <SomeCustomComponent
      onClick={onClick}
      onChange={onChange}
    />
  );
}
```