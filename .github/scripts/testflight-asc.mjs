// Inspects who receives a SkyLens TestFlight build, and gives a build to one internal group.
//
//   node testflight-asc.mjs audit        Prints groups, builds and App Store versions. Reads only.
//   node testflight-asc.mjs guard        Fails unless only TESTFLIGHT_GROUP can receive a build.
//   node testflight-asc.mjs distribute   Waits for BUILD_NUMBER to process, then gives it to
//                                        TESTFLIGHT_GROUP and reads the result back.
//
// Three limits, enforced below rather than by convention:
// - It works only on sk.skylens.app. The same Apple account holds another live app.
// - Its only write adds a build to a beta group. It can't submit for review or release.
// - This repository is public, so its logs are too. Tester emails are masked, names aren't read.

import crypto from 'node:crypto';

const BUNDLE = 'sk.skylens.app';
const BASE = 'https://api.appstoreconnect.apple.com';
const ALLOWED_WRITE = /^\/v1\/betaGroups\/[0-9a-f-]+\/relationships\/builds$/;
const WAIT_FOR_PROCESSING_MS = 100 * 60 * 1000;
const POLL_MS = 60 * 1000;

const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, BUNDLE_ID, TESTFLIGHT_GROUP, BUILD_NUMBER } = process.env;

const stop = (message) => {
  console.error(`::error::${message}`);
  process.exit(1);
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

for (const [name, value] of Object.entries({ ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, BUNDLE_ID })) {
  if (!value) stop(`Missing ${name}`);
}
if (BUNDLE_ID !== BUNDLE) stop(`This script only works on ${BUNDLE}`);

let cachedToken = { value: '', until: 0 };

function token() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken.until > now + 60) return cachedToken.value;
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const head = part({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' });
  const body = part({ iss: ASC_ISSUER_ID, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' });
  const signature = crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key: ASC_KEY_P8, dsaEncoding: 'ieee-p1363' });
  cachedToken = { value: `${head}.${body}.${signature.toString('base64url')}`, until: now + 1100 };
  return cachedToken.value;
}

async function call(method, path, body) {
  if (method !== 'GET' && !ALLOWED_WRITE.test(path)) stop(`Refused: ${method} ${path}`);
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(path.startsWith('http') ? path : BASE + path, {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const retryable = method === 'GET' && (response.status === 429 || response.status >= 500);
    if (retryable && attempt < 4) {
      await sleep(attempt * 5000);
      continue;
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const errors = (detail.errors ?? []).map((e) => `${e.code}: ${e.detail ?? e.title}`).join('; ');
      stop(`${method} ${path.split('?')[0]} returned ${response.status}. ${errors}`);
    }
    return response.status === 204 ? null : response.json();
  }
}

async function everyPage(path) {
  const rows = [];
  for (let next = path; next; ) {
    const page = await call('GET', next);
    rows.push(...page.data);
    next = page.links?.next;
  }
  return rows;
}

async function findApp() {
  const apps = await everyPage(`/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE)}&limit=20`);
  const exact = apps.filter((app) => app.attributes.bundleId === BUNDLE);
  if (exact.length !== 1) stop(`Expected one app with bundle ID ${BUNDLE}, found ${exact.length}`);
  return exact[0];
}

const listGroups = (app) => everyPage(`/v1/betaGroups?filter[app]=${app.id}&limit=200`);

const groupTesters = (group) => everyPage(`/v1/betaGroups/${group.id}/betaTesters?limit=200&fields[betaTesters]=email`);

function maskEmail(email) {
  if (!email) return 'hidden address';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function describeBuildRelations(build, included) {
  const related = (key) => {
    const links = build.relationships?.[key]?.data;
    const ids = Array.isArray(links) ? links : links ? [links] : [];
    return ids.map((link) => included.find((row) => row.type === link.type && row.id === link.id)).filter(Boolean);
  };
  return {
    groups: related('betaGroups').map((group) => group.attributes.name),
    beta: related('buildBetaDetail')[0]?.attributes ?? {},
    marketing: related('preReleaseVersion')[0]?.attributes?.version ?? 'unknown',
  };
}

async function audit() {
  const app = await findApp();
  console.log(`App: ${app.attributes.name}, ${app.attributes.bundleId}, ${app.id}`);

  console.log('\nBeta groups:');
  const groups = await listGroups(app);
  if (!groups.length) console.log('  none');
  for (const group of groups) {
    const a = group.attributes;
    const testers = await groupTesters(group);
    console.log(`  "${a.name}": ${a.isInternalGroup ? 'internal' : 'EXTERNAL'}, automatic distribution ${a.hasAccessToAllBuilds ? 'ON' : 'off'}, public link ${a.publicLinkEnabled ? 'ON' : 'off'}, ${testers.length} testers`);
    for (const tester of testers) console.log(`      ${maskEmail(tester.attributes.email)}`);
  }

  console.log('\nRecent builds:');
  const page = await call('GET', `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=8&include=preReleaseVersion,buildBetaDetail,betaGroups`);
  if (!page.data.length) console.log('  none');
  for (const build of page.data) {
    const a = build.attributes;
    const { groups: names, beta, marketing } = describeBuildRelations(build, page.included ?? []);
    console.log(`  ${marketing} (${a.version}): ${a.processingState}, expired ${a.expired}, uploaded ${a.uploadedDate}, internal ${beta.internalBuildState ?? '?'}, external ${beta.externalBuildState ?? '?'}, groups [${names.join(', ')}]`);
  }

  console.log('\nApp Store versions:');
  const versions = await everyPage(`/v1/apps/${app.id}/appStoreVersions?limit=20`);
  if (!versions.length) console.log('  none');
  for (const version of versions) {
    const a = version.attributes;
    console.log(`  ${a.platform} ${a.versionString}: ${a.appVersionState ?? a.appStoreState}`);
  }
}

async function guard() {
  if (!TESTFLIGHT_GROUP) stop('Set the repository variable TESTFLIGHT_INTERNAL_GROUP to the intended internal group');
  const app = await findApp();
  const groups = await listGroups(app);
  const named = groups.filter((group) => group.attributes.name === TESTFLIGHT_GROUP);
  if (named.length !== 1) stop(`Expected one group named "${TESTFLIGHT_GROUP}", found ${named.length}`);
  const [intended] = named;
  if (!intended.attributes.isInternalGroup) stop(`"${TESTFLIGHT_GROUP}" isn't an internal group`);
  const testers = await groupTesters(intended);
  if (!testers.length) stop(`"${TESTFLIGHT_GROUP}" has no testers`);

  const others = groups.filter((group) => group.id !== intended.id);
  const automatic = others.filter((group) => group.attributes.hasAccessToAllBuilds === true);
  if (automatic.length) {
    stop(`Automatic distribution would also reach: ${automatic.map((g) => `"${g.attributes.name}"`).join(', ')}. Turn it off in App Store Connect first`);
  }
  console.log(`Only "${TESTFLIGHT_GROUP}" can receive a build: ${testers.length} testers, automatic distribution ${intended.attributes.hasAccessToAllBuilds ? 'ON' : 'off'}, ${others.length} other groups with it off`);
  return { app, intended, others };
}

async function distribute() {
  if (!/^\d+$/.test(BUILD_NUMBER ?? '')) stop('Missing BUILD_NUMBER');
  const { app, intended, others } = await guard();

  const deadline = Date.now() + WAIT_FOR_PROCESSING_MS;
  let build, last;
  for (;;) {
    const page = await call('GET', `/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD_NUMBER}&limit=2`);
    build = page.data[0];
    const state = build?.attributes.processingState ?? 'NOT_LISTED_YET';
    if (state !== last) console.log(`Build ${BUILD_NUMBER}: ${state}`);
    last = state;
    if (state === 'VALID') break;
    if (state === 'FAILED' || state === 'INVALID') stop(`Apple rejected build ${BUILD_NUMBER}: ${state}`);
    if (Date.now() > deadline) stop(`Build ${BUILD_NUMBER} was still ${state} when this job stopped waiting. Re-run this job`);
    await sleep(POLL_MS);
  }

  if (intended.attributes.hasAccessToAllBuilds) {
    console.log(`"${TESTFLIGHT_GROUP}" has automatic distribution, so nothing needs adding`);
  } else {
    await call('POST', `/v1/betaGroups/${intended.id}/relationships/builds`, { data: [{ type: 'builds', id: build.id }] });
    console.log(`Added build ${BUILD_NUMBER} to "${TESTFLIGHT_GROUP}"`);
  }

  for (let attempt = 1; ; attempt++) {
    const page = await call('GET', `/v1/builds/${build.id}?include=betaGroups,buildBetaDetail,preReleaseVersion`);
    const { groups, beta, marketing } = describeBuildRelations(page.data, page.included ?? []);
    const stray = others.filter((group) => groups.includes(group.attributes.name));
    if (stray.length) stop(`Build ${BUILD_NUMBER} also reached: ${stray.map((g) => `"${g.attributes.name}"`).join(', ')}`);
    const ready = beta.internalBuildState === 'IN_BETA_TESTING';
    if (ready || attempt === 10) {
      console.log(`Read back: ${marketing} (${BUILD_NUMBER}), processing ${page.data.attributes.processingState}, internal ${beta.internalBuildState}, external ${beta.externalBuildState}, groups [${groups.join(', ')}]`);
      if (!ready) stop(`Build ${BUILD_NUMBER} isn't available to testers yet: ${beta.internalBuildState}`);
      return;
    }
    await sleep(30 * 1000);
  }
}

const commands = { audit, guard, distribute };
if (!commands[process.argv[2]]) stop('Use audit, guard or distribute');
await commands[process.argv[2]]();
