import characters from './characters';
import common from './common';
import dock from './dock';
import editor from './editor';
import exportLocale from './export';
import graph from './graph';
import help from './help';
import navigation from './navigation';
import settings from './settings';
import stats from './stats';
import storyline from './storyline';
import timeline from './timeline';
import worldbuilding from './worldbuilding';

export const namespaces = {
  characters,
  common,
  dock,
  editor,
  export: exportLocale,
  graph,
  help,
  navigation,
  settings,
  stats,
  storyline,
  timeline,
  worldbuilding,
};

const en = {
  ...characters,
  ...common,
  ...dock,
  ...editor,
  ...exportLocale,
  ...graph,
  ...help,
  ...navigation,
  ...settings,
  ...stats,
  ...storyline,
  ...timeline,
  ...worldbuilding,
};

export default en;
