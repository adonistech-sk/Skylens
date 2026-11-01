import { SkyObject } from '../data/catalog';

/* eslint-disable @typescript-eslint/no-require-imports */
export const images = {
  backdrop: require('../../assets/images/backdrop.jpg'),
  earthOnboarding: require('../../assets/images/earth-onboarding.jpg'),
  earthHorizon: require('../../assets/images/earth-horizon.jpg'),
  mountains: require('../../assets/images/location-mountains.jpg'),
  saturnPro: require('../../assets/images/saturn-pro.jpg'),
  orionNebulaHero: require('../../assets/images/orion-nebula-hero.jpg'),
  moonDisc: require('../../assets/images/moon-disc.jpg'),
  arStandIn: require('../../assets/images/ar-standin.jpg'),
};

const THUMBS: Record<string, number> = {
  'body:moon': require('../../assets/images/planet-moon.jpg'),
  'body:mercury': require('../../assets/images/planet-mercury.jpg'),
  'body:venus': require('../../assets/images/planet-venus.jpg'),
  'body:mars': require('../../assets/images/planet-mars.jpg'),
  'body:jupiter': require('../../assets/images/planet-jupiter.jpg'),
  'body:saturn': require('../../assets/images/planet-saturn.jpg'),
  'body:uranus': require('../../assets/images/planet-uranus.jpg'),
  'body:neptune': require('../../assets/images/planet-neptune.jpg'),
  'dso:M31': require('../../assets/images/thumb-andromeda.jpg'),
  'dso:M42': require('../../assets/images/thumb-orion-nebula.jpg'),
  'dso:M51': require('../../assets/images/thumb-m51.jpg'),
  'dso:M45': require('../../assets/images/thumb-pleiades.jpg'),
  'dso:M8': require('../../assets/images/thumb-lagoon.jpg'),
};

const HEROES: Record<string, number> = {
  'dso:M31': require('../../assets/images/andromeda-hero.jpg'),
  'dso:M42': require('../../assets/images/orion-nebula-hero.jpg'),
  'dso:M51': require('../../assets/images/m51-hero.jpg'),
  'dso:M45': require('../../assets/images/pleiades-hero.jpg'),
  'dso:M8': require('../../assets/images/lagoon-hero.jpg'),
  'body:jupiter': require('../../assets/images/jupiter-hero.jpg'),
  'body:mars': require('../../assets/images/mars-hero.jpg'),
};

/** Only a picture of that exact object. Nothing stands in for a missing photograph. */
export const thumbFor = (o: Pick<SkyObject, 'id'>) => THUMBS[o.id] ?? null;
export const heroFor = (o: Pick<SkyObject, 'id'>) => HEROES[o.id] ?? null;
