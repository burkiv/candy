import { useGameStore } from '../stores/gameStore';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function VolumeSlider({
  label,
  value,
  onChange,
  accentClassName,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  accentClassName: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className={`text-sm font-bold ${accentClassName}`}>{formatPercent(value)}</div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-300"
      />
    </div>
  );
}

export function AudioSettingsPanel({
  title = 'Ses Ayarlari',
  subtitle = 'Muzik, ambiyans ve efekt seviyelerini ayarla.',
  className = '',
}: {
  title?: string | null;
  subtitle?: string | null;
  className?: string;
}) {
  const audioSettings = useGameStore((state) => state.audioSettings);
  const setAudioSetting = useGameStore((state) => state.setAudioSetting);
  const hasHeader = Boolean(title || subtitle);

  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 p-4 ${className}`.trim()}>
      {hasHeader ? (
        <>
          {title ? (
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{title}</div>
          ) : null}
          {subtitle ? (
            <div className={`${title ? 'mt-2' : ''} text-sm leading-6 text-white/68`}>
              {subtitle}
            </div>
          ) : null}
        </>
      ) : null}
      <div className={`${hasHeader ? 'mt-4' : ''} grid gap-3`}>
        <VolumeSlider
          label="Arka Plan Muzigi"
          value={audioSettings.musicVolume}
          onChange={(value) => setAudioSetting('musicVolume', value)}
          accentClassName="text-cyan-200"
        />
        <VolumeSlider
          label="Ambiyans"
          value={audioSettings.ambienceVolume}
          onChange={(value) => setAudioSetting('ambienceVolume', value)}
          accentClassName="text-teal-200"
        />
        <VolumeSlider
          label="Efektler"
          value={audioSettings.effectsVolume}
          onChange={(value) => setAudioSetting('effectsVolume', value)}
          accentClassName="text-amber-200"
        />
      </div>
    </div>
  );
}
