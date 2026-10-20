// ---------------------------------------------------------------------------
// Main Navigation View Types
// ---------------------------------------------------------------------------

// 'write' is the editor workspace; all other values map 1:1 to TabId so the
// ActivityBar can drive renderDockView directly when a module is selected.
export type MainViewId =
  | 'write'
  | 'outline'
  | 'storyline'
  | 'timeline'
  | 'relationships'
  | 'stats'
  | 'context'
  | 'characters'
  | 'worldbuilding'
  | 'moodboard';

export interface MainViewConfig {
  id: MainViewId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface PlotBeat {
  id: string;
  act: 'Act I: The Hook' | 'Act II: The Confrontation' | 'Act III: The Climax' | 'Epilogue';
  title: string;
  summary: string;
  thread: 'Main Conspiracy' | 'Protagonist Arc' | 'World & Lore';
  status: 'Planned' | 'In Progress' | 'Completed';
}
