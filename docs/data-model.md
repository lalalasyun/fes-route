# Data Model

Issue #2 defines the first durable canonical model for festival data. The goal is to keep the write path normalized, make duplicate prevention explicit, and still allow the UI to derive a simple event-centric read model.

## Design principles

- Canonical data is normalized by entity type: `events`, `artists`, `stages`, `timetableEntries`, `eventSources`, `eventProposals`, `userPlans`.
- Each entity has one stable `id` that survives source imports, proposal review, and UI reshaping.
- Relations use foreign keys instead of nested write-time duplication.
- Source-specific or unverified information belongs in `eventSources` / `eventProposals`, not in canonical entity identity fields.
- The UI may derive denormalized event views from canonical collections.

## Canonical collections

### Event

Represents one festival edition or one schedulable event.

Required fields:

- `id`: stable slug, for example `tokyo-sound-weekend-2026`
- `seriesSlug`: cross-year family slug, for example `tokyo-sound-weekend`
- `name`: display name for this edition
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `timezone`: IANA timezone, for example `Asia/Tokyo`
- `venueName`: venue or area name
- `status`: `draft` | `published` | `cancelled`
- `createdAt`
- `updatedAt`

Optional fields:

- `city`
- `prefecture`
- `countryCode`
- `officialUrl`
- `description`

### Artist

Represents one canonical performer identity shared across events.

Required fields:

- `id`: stable slug, for example `luminous-echo`
- `name`
- `createdAt`
- `updatedAt`

Optional fields:

- `nameKana`
- `aliases`: alternate spellings or old names
- `officialUrl`
- `spotifyUrl`
- `notes`

### Stage

Represents one stage namespace within an event.

Required fields:

- `id`: event-scoped slug, for example `tokyo-sound-weekend-2026:ocean-stage`
- `eventId`
- `name`
- `sortOrder`
- `createdAt`
- `updatedAt`

Optional fields:

- `shortName`
- `areaName`

### TimetableEntry

Represents one artist performance block on one stage.

Required fields:

- `id`: deterministic slug, for example `tokyo-sound-weekend-2026:ocean-stage:luminous-echo:2026-08-22t11:00`
- `eventId`
- `artistId`
- `stageId`
- `startAt`: ISO 8601 datetime with timezone offset
- `endAt`: ISO 8601 datetime with timezone offset
- `status`: `scheduled` | `cancelled` | `moved`
- `createdAt`
- `updatedAt`

Optional fields:

- `sourceId`
- `setLengthMinutes`
- `notes`

### EventSource

Represents a source URL or attachment used to create or update event data.

Required fields:

- `id`
- `eventId`
- `sourceType`: `ticketing` | `official_site` | `x_post` | `image` | `pdf` | `manual`
- `url`
- `trustLevel`: `official` | `operator_reviewed` | `user_submitted`
- `createdAt`
- `updatedAt`

Optional fields:

- `title`
- `fetchedAt`
- `notes`

### EventProposal

Represents unreviewed user-submitted event or timetable changes.

Required fields:

- `id`
- `proposalType`: `create_event` | `update_event` | `update_timetable` | `merge_event`
- `status`: `pending` | `accepted` | `rejected` | `merged`
- `proposedData`
- `createdAt`
- `updatedAt`

Optional fields:

- `targetEventId`
- `sourceUrl`
- `submitterName`
- `reviewedBy`
- `reviewedAt`

### UserPlan

Represents one user-owned plan for one event.

Required fields:

- `id`
- `eventId`
- `shareId`: opaque public token
- `ownershipType`: `anonymous` | `registered`
- `createdAt`
- `updatedAt`

Optional fields:

- `anonymousUserId`
- `displayName`
- `note`

### UserPlanEntry

Represents one selected timetable entry inside one user plan.

Required fields:

- `id`
- `userPlanId`
- `timetableEntryId`
- `selectionStatus`: `selected` | `maybe` | `hidden`
- `createdAt`
- `updatedAt`

Optional fields:

- `note`

## Relations

- `Stage.eventId -> Event.id`
- `TimetableEntry.eventId -> Event.id`
- `TimetableEntry.artistId -> Artist.id`
- `TimetableEntry.stageId -> Stage.id`
- `EventSource.eventId -> Event.id`
- `EventProposal.targetEventId -> Event.id` when present
- `UserPlan.eventId -> Event.id`
- `UserPlanEntry.userPlanId -> UserPlan.id`
- `UserPlanEntry.timetableEntryId -> TimetableEntry.id`

## Duplicate prevention rules

Duplicate prevention must be enforced before data becomes canonical. These rules define the first-pass constraints.

### Identifier rules

- `Event.id` is derived from `seriesSlug + edition year` and is globally unique.
- `Artist.id` is derived from the reviewed canonical name and is globally unique.
- `Stage.id` is derived from `eventId + normalized stage name` and is unique within the full dataset.
- `TimetableEntry.id` is derived from `eventId + stageId + artistId + startAt` and is globally unique.
- `UserPlan.shareId` is opaque and globally unique.

### Uniqueness constraints

- Events: unique on `id`
- Artists: unique on `id`
- Stages: unique on `(eventId, normalized(name))`
- Timetable entries: unique on `(eventId, stageId, startAt)`
- Timetable entries: unique on `(eventId, artistId, startAt)` for the initial MVP
- User plans: unique on `shareId`
- User plan entries: unique on `(userPlanId, timetableEntryId)`

### Review-time merge rules

- Event proposals for the same `officialUrl` or same `normalized(name) + startDate + venueName` must be reviewed as potential duplicates.
- Artist proposals that differ only by case, whitespace, punctuation, or known aliases must resolve to one canonical `Artist.id`.
- Stage proposals are never shared across events; the same stage name in two different events creates two `Stage` rows.
- If an artist moves stages or times, the canonical action is update-or-cancel the existing `TimetableEntry`, not create a second active row with the same uniqueness key.

## Recommended JSON shape

```json
{
  "events": [],
  "artists": [],
  "stages": [],
  "timetableEntries": [],
  "eventSources": [],
  "eventProposals": [],
  "userPlans": [],
  "userPlanEntries": []
}
```

## Sample mapping

The prototype UI can derive this read model from canonical collections:

```js
{
  id,
  name,
  date,
  venue,
  stages: [{ id, name }],
  slots: [{ id, artist, stageId, start, end }]
}
```

That derived shape is a presentation helper only. Canonical sample data should remain normalized.
