const EVENT_ID = 'tokyo-sound-weekend-2026';
const TZ_OFFSET = '+09:00';
const CREATED_AT = '2026-05-20T00:00:00+09:00';
const UPDATED_AT = '2026-05-20T00:00:00+09:00';

function atLocalTime(date, time) {
  return `${date}T${time}:00${TZ_OFFSET}`;
}

function toClockTime(isoDateTime) {
  return isoDateTime.slice(11, 16);
}

export const sampleDataModel = {
  events: [
    {
      id: EVENT_ID,
      seriesSlug: 'tokyo-sound-weekend',
      name: 'Tokyo Sound Weekend 2026',
      startDate: '2026-08-22',
      endDate: '2026-08-22',
      timezone: 'Asia/Tokyo',
      venueName: 'Shinkiba Bay Area',
      city: 'Tokyo',
      countryCode: 'JP',
      status: 'published',
      officialUrl: 'https://example.com/tokyo-sound-weekend-2026',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
  ],
  artists: [
    { id: 'luminous-echo', name: 'Luminous Echo', aliases: [], officialUrl: 'https://example.com/artists/luminous-echo', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'neon-harbor', name: 'Neon Harbor', aliases: [], officialUrl: 'https://example.com/artists/neon-harbor', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'paper-lights', name: 'Paper Lights', aliases: [], officialUrl: 'https://example.com/artists/paper-lights', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'midnight-radio', name: 'Midnight Radio', aliases: [], officialUrl: 'https://example.com/artists/midnight-radio', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'slow-dive-club', name: 'Slow Dive Club', aliases: [], officialUrl: 'https://example.com/artists/slow-dive-club', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'blue-static', name: 'Blue Static', aliases: [], officialUrl: 'https://example.com/artists/blue-static', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'velvet-youth', name: 'Velvet Youth', aliases: [], officialUrl: 'https://example.com/artists/velvet-youth', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'sunset-cinema', name: 'Sunset Cinema', aliases: [], officialUrl: 'https://example.com/artists/sunset-cinema', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: 'afterglow-motel', name: 'Afterglow Motel', aliases: [], officialUrl: 'https://example.com/artists/afterglow-motel', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
  ],
  stages: [
    { id: `${EVENT_ID}:ocean-stage`, eventId: EVENT_ID, name: 'Ocean Stage', shortName: 'Ocean', sortOrder: 1, createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:forest-stage`, eventId: EVENT_ID, name: 'Forest Stage', shortName: 'Forest', sortOrder: 2, createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:moon-stage`, eventId: EVENT_ID, name: 'Moon Stage', shortName: 'Moon', sortOrder: 3, createdAt: CREATED_AT, updatedAt: UPDATED_AT },
  ],
  timetableEntries: [
    { id: `${EVENT_ID}:ocean-stage:luminous-echo:2026-08-22t11:00`, eventId: EVENT_ID, artistId: 'luminous-echo', stageId: `${EVENT_ID}:ocean-stage`, startAt: atLocalTime('2026-08-22', '11:00'), endAt: atLocalTime('2026-08-22', '11:40'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:forest-stage:neon-harbor:2026-08-22t11:20`, eventId: EVENT_ID, artistId: 'neon-harbor', stageId: `${EVENT_ID}:forest-stage`, startAt: atLocalTime('2026-08-22', '11:20'), endAt: atLocalTime('2026-08-22', '12:00'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:moon-stage:paper-lights:2026-08-22t12:05`, eventId: EVENT_ID, artistId: 'paper-lights', stageId: `${EVENT_ID}:moon-stage`, startAt: atLocalTime('2026-08-22', '12:05'), endAt: atLocalTime('2026-08-22', '12:45'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:ocean-stage:midnight-radio:2026-08-22t12:20`, eventId: EVENT_ID, artistId: 'midnight-radio', stageId: `${EVENT_ID}:ocean-stage`, startAt: atLocalTime('2026-08-22', '12:20'), endAt: atLocalTime('2026-08-22', '13:00'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:forest-stage:slow-dive-club:2026-08-22t13:10`, eventId: EVENT_ID, artistId: 'slow-dive-club', stageId: `${EVENT_ID}:forest-stage`, startAt: atLocalTime('2026-08-22', '13:10'), endAt: atLocalTime('2026-08-22', '13:50'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:moon-stage:blue-static:2026-08-22t13:35`, eventId: EVENT_ID, artistId: 'blue-static', stageId: `${EVENT_ID}:moon-stage`, startAt: atLocalTime('2026-08-22', '13:35'), endAt: atLocalTime('2026-08-22', '14:15'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:ocean-stage:velvet-youth:2026-08-22t14:20`, eventId: EVENT_ID, artistId: 'velvet-youth', stageId: `${EVENT_ID}:ocean-stage`, startAt: atLocalTime('2026-08-22', '14:20'), endAt: atLocalTime('2026-08-22', '15:00'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:forest-stage:sunset-cinema:2026-08-22t14:40`, eventId: EVENT_ID, artistId: 'sunset-cinema', stageId: `${EVENT_ID}:forest-stage`, startAt: atLocalTime('2026-08-22', '14:40'), endAt: atLocalTime('2026-08-22', '15:20'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
    { id: `${EVENT_ID}:moon-stage:afterglow-motel:2026-08-22t15:25`, eventId: EVENT_ID, artistId: 'afterglow-motel', stageId: `${EVENT_ID}:moon-stage`, startAt: atLocalTime('2026-08-22', '15:25'), endAt: atLocalTime('2026-08-22', '16:05'), status: 'scheduled', createdAt: CREATED_AT, updatedAt: UPDATED_AT },
  ],
  eventSources: [
    {
      id: `${EVENT_ID}:manual-seed`,
      eventId: EVENT_ID,
      sourceType: 'manual',
      url: 'https://example.com/tokyo-sound-weekend-2026',
      title: 'Manual seed data',
      trustLevel: 'operator_reviewed',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
  ],
  eventProposals: [],
  userPlans: [
    {
      id: `${EVENT_ID}:starter-plan`,
      eventId: EVENT_ID,
      shareId: 'starter-plan',
      ownershipType: 'anonymous',
      anonymousUserId: 'anon-demo-user',
      displayName: 'Starter Plan',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
  ],
  userPlanEntries: [],
};

function buildSampleFestival(dataModel, eventId) {
  const event = dataModel.events.find((item) => item.id === eventId);
  const artistsById = new Map(dataModel.artists.map((artist) => [artist.id, artist]));

  const stages = dataModel.stages
    .filter((stage) => stage.eventId === eventId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((stage) => ({
      id: stage.id,
      name: stage.name,
    }));

  const slots = dataModel.timetableEntries
    .filter((entry) => entry.eventId === eventId && entry.status === 'scheduled')
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .map((entry) => ({
      id: entry.id,
      artist: artistsById.get(entry.artistId)?.name ?? entry.artistId,
      stageId: entry.stageId,
      start: toClockTime(entry.startAt),
      end: toClockTime(entry.endAt),
    }));

  return {
    id: event.id,
    name: event.name,
    date: event.startDate,
    venue: event.venueName,
    stages,
    slots,
  };
}

export const sampleFestival = buildSampleFestival(sampleDataModel, EVENT_ID);
