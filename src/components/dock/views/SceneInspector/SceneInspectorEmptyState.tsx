import React, { memo } from 'react';
import { Sliders } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

function SceneInspectorEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none bg-zinc-950 text-zinc-500">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
        <Sliders className="w-5 h-5 text-zinc-600" />
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-1">
        {t('sceneInspector')}
      </h3>
      <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
        {t('selectSceneToInspect')}
      </p>
    </div>
  );
}

export default memo(SceneInspectorEmptyState);
