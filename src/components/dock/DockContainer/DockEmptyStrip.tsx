import { memo } from 'react';
import { PlusCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';

interface DockEmptyStripProps {
  type: 'single' | 'top' | 'bottom';
}

function DockEmptyStrip({ type }: DockEmptyStripProps) {
  const { t } = useTranslation();

  if (type === 'top') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
        <PlusCircle className="w-5 h-5 text-zinc-600" />
        <p className="text-xs font-medium text-zinc-300">{t('emptyTopStrip')}</p>
        <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
          {t('emptyTopStripHint')}
        </p>
      </div>
    );
  }

  if (type === 'bottom') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
        <PlusCircle className="w-5 h-5 text-zinc-600" />
        <p className="text-xs font-medium text-zinc-300">{t('emptyBottomStrip')}</p>
        <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
          {t('emptyBottomStripHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-zinc-500 gap-2">
      <PlusCircle className="w-6 h-6 text-zinc-600" />
      <p className="text-xs font-medium text-zinc-300">{t('emptyPanel')}</p>
      <p className="text-[11px] text-zinc-500 max-w-[170px] leading-relaxed">
        {t('emptyPanelHint')}
      </p>
    </div>
  );
}

export default memo(DockEmptyStrip);
