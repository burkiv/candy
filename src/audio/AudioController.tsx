import { Howl } from 'howler';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getWorldDefinition } from '../worlds';
import type {
  WorldAudioLoopConfig,
  WorldAudioOccasionalConfig,
} from '../worlds/types';

const COMMON_SOUND_CONFIG = {
  coin: {
    src: ['/sounds/coin.mp3', '/sounds/coin.ogg', '/sounds/coin.wav'],
    volume: 0.56,
  },
  hit: {
    src: ['/sounds/hit.mp3', '/sounds/hit.ogg', '/sounds/hit.wav'],
    volume: 0.68,
  },
  jump: {
    src: ['/sounds/jump.mp3', '/sounds/jump.ogg', '/sounds/jump.wav'],
    volume: 0.54,
  },
  crouch: {
    src: ['/sounds/crouch.mp3', '/sounds/crouch.ogg', '/sounds/crouch.wav'],
    volume: 0.5,
  },
} as const;

type CommonSoundBank = {
  coin: Howl;
  hit: Howl;
  jump: Howl;
  crouch: Howl;
};

type WorldSoundBank = {
  music: Howl;
  ambience?: Howl;
  occasional?: Howl;
};

function playOneShot(sound: Howl) {
  sound.stop();
  sound.play();
}

function createLoopingSound(config: WorldAudioLoopConfig) {
  return new Howl({
    src: config.src,
    loop: true,
    volume: config.volume,
    html5: config.html5,
  });
}

function createOccasionalSound(config: WorldAudioOccasionalConfig) {
  return new Howl({
    src: config.src,
    volume: config.volume,
  });
}

function applyEffectsVolume(bank: CommonSoundBank, effectsVolume: number) {
  bank.coin.volume(COMMON_SOUND_CONFIG.coin.volume * effectsVolume);
  bank.hit.volume(COMMON_SOUND_CONFIG.hit.volume * effectsVolume);
  bank.jump.volume(COMMON_SOUND_CONFIG.jump.volume * effectsVolume);
  bank.crouch.volume(COMMON_SOUND_CONFIG.crouch.volume * effectsVolume);
}

function applyWorldVolumes(
  bank: WorldSoundBank,
  worldId: ReturnType<typeof useGameStore.getState>['selectedWorld'],
  musicVolume: number,
  ambienceVolume: number,
) {
  const world = getWorldDefinition(worldId);

  bank.music.volume(world.audio.music.volume * musicVolume);

  if (bank.ambience && world.audio.ambience) {
    bank.ambience.volume(world.audio.ambience.volume * ambienceVolume);
  }

  if (bank.occasional && world.audio.occasional) {
    bank.occasional.volume(world.audio.occasional.volume * ambienceVolume);
  }
}

export function AudioController() {
  const phase = useGameStore((state) => state.phase);
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  const audioSettings = useGameStore((state) => state.audioSettings);
  const coinsCollected = useGameStore((state) => state.coinsCollected);
  const starsCollected = useGameStore((state) => state.starsCollected);
  const collisionCount = useGameStore((state) => state.collisionCount);
  const isJumping = useGameStore((state) => state.isJumping);
  const isSquatting = useGameStore((state) => state.isSquatting);

  const commonSoundBankRef = useRef<CommonSoundBank | null>(null);
  const worldSoundBankRef = useRef<WorldSoundBank | null>(null);
  const audioUnlockedRef = useRef(false);
  const occasionalTimerRef = useRef<number | null>(null);
  const previousRef = useRef({
    coinsCollected,
    starsCollected,
    collisionCount,
    isJumping,
    isSquatting,
  });

  function clearOccasionalTimer() {
    if (occasionalTimerRef.current !== null) {
      window.clearTimeout(occasionalTimerRef.current);
      occasionalTimerRef.current = null;
    }
  }

  function stopWorldAudio() {
    clearOccasionalTimer();
    const bank = worldSoundBankRef.current;

    if (!bank) {
      return;
    }

    bank.music.stop();
    bank.ambience?.stop();
    bank.occasional?.stop();
  }

  function scheduleOccasional() {
    clearOccasionalTimer();

    const state = useGameStore.getState();

    if (!audioUnlockedRef.current || state.phase !== 'PLAYING') {
      return;
    }

    const world = getWorldDefinition(state.selectedWorld);
    const occasionalConfig = world.audio.occasional;
    const occasionalSound = worldSoundBankRef.current?.occasional;

    if (!occasionalConfig || !occasionalSound) {
      return;
    }

    const delay =
      occasionalConfig.minDelayMs +
      Math.random() * (occasionalConfig.maxDelayMs - occasionalConfig.minDelayMs);

    occasionalTimerRef.current = window.setTimeout(() => {
      const latest = useGameStore.getState();

      if (latest.phase !== 'PLAYING' || latest.selectedWorld !== world.id) {
        clearOccasionalTimer();
        return;
      }

      occasionalSound.play();
      scheduleOccasional();
    }, delay);
  }

  useEffect(() => {
    const bank: CommonSoundBank = {
      coin: new Howl({
        src: COMMON_SOUND_CONFIG.coin.src,
        volume: COMMON_SOUND_CONFIG.coin.volume * audioSettings.effectsVolume,
      }),
      hit: new Howl({
        src: COMMON_SOUND_CONFIG.hit.src,
        volume: COMMON_SOUND_CONFIG.hit.volume * audioSettings.effectsVolume,
      }),
      jump: new Howl({
        src: COMMON_SOUND_CONFIG.jump.src,
        volume: COMMON_SOUND_CONFIG.jump.volume * audioSettings.effectsVolume,
      }),
      crouch: new Howl({
        src: COMMON_SOUND_CONFIG.crouch.src,
        volume: COMMON_SOUND_CONFIG.crouch.volume * audioSettings.effectsVolume,
      }),
    };

    commonSoundBankRef.current = bank;

    return () => {
      Object.values(bank).forEach((sound) => sound.unload());
      commonSoundBankRef.current = null;
    };
  }, []);

  useEffect(() => {
    const bank = commonSoundBankRef.current;

    if (!bank) {
      return;
    }

    applyEffectsVolume(bank, audioSettings.effectsVolume);
  }, [audioSettings.effectsVolume]);

  useEffect(() => {
    const world = getWorldDefinition(selectedWorld);
    const bank: WorldSoundBank = {
      music: createLoopingSound(world.audio.music),
    };

    if (world.audio.ambience) {
      bank.ambience = createLoopingSound(world.audio.ambience);
    }

    if (world.audio.occasional) {
      bank.occasional = createOccasionalSound(world.audio.occasional);
    }

    applyWorldVolumes(
      bank,
      selectedWorld,
      audioSettings.musicVolume,
      audioSettings.ambienceVolume,
    );

    worldSoundBankRef.current = bank;

    if (audioUnlockedRef.current && phase !== 'GAME_OVER') {
      bank.music.play();
      bank.ambience?.play();
      scheduleOccasional();
    }

    return () => {
      stopWorldAudio();
      Object.values(bank).forEach((sound) => sound?.unload());

      if (worldSoundBankRef.current === bank) {
        worldSoundBankRef.current = null;
      }
    };
  }, [selectedWorld]);

  useEffect(() => {
    const bank = worldSoundBankRef.current;

    if (!bank) {
      return;
    }

    applyWorldVolumes(
      bank,
      selectedWorld,
      audioSettings.musicVolume,
      audioSettings.ambienceVolume,
    );
  }, [
    selectedWorld,
    audioSettings.musicVolume,
    audioSettings.ambienceVolume,
  ]);

  useEffect(() => {
    function unlockAudio() {
      audioUnlockedRef.current = true;
      const bank = worldSoundBankRef.current;

      if (!bank || phase === 'GAME_OVER') {
        return;
      }

      if (!bank.music.playing()) {
        bank.music.play();
      }

      if (bank.ambience && !bank.ambience.playing()) {
        bank.ambience.play();
      }

      scheduleOccasional();
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [phase, selectedWorld]);

  useEffect(() => {
    const bank = worldSoundBankRef.current;

    if (!bank || !audioUnlockedRef.current) {
      return;
    }

    const shouldPlayLoops = phase !== 'GAME_OVER';

    if (shouldPlayLoops) {
      if (!bank.music.playing()) {
        bank.music.play();
      }

      if (bank.ambience && !bank.ambience.playing()) {
        bank.ambience.play();
      }
    } else {
      bank.music.stop();
      bank.ambience?.stop();
      bank.occasional?.stop();
    }

    scheduleOccasional();
  }, [phase, selectedWorld]);

  useEffect(() => {
    if (!audioUnlockedRef.current || !commonSoundBankRef.current) {
      previousRef.current = {
        coinsCollected,
        starsCollected,
        collisionCount,
        isJumping,
        isSquatting,
      };
      return;
    }

    const previous = previousRef.current;
    const sounds = commonSoundBankRef.current;

    if (
      coinsCollected > previous.coinsCollected ||
      starsCollected > previous.starsCollected
    ) {
      playOneShot(sounds.coin);
    }

    if (collisionCount > previous.collisionCount) {
      playOneShot(sounds.hit);
    }

    if (!previous.isJumping && isJumping) {
      playOneShot(sounds.jump);
    }

    if (!previous.isSquatting && isSquatting) {
      playOneShot(sounds.crouch);
    }

    previousRef.current = {
      coinsCollected,
      starsCollected,
      collisionCount,
      isJumping,
      isSquatting,
    };
  }, [coinsCollected, starsCollected, collisionCount, isJumping, isSquatting]);

  return null;
}
