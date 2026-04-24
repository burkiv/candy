import { Howl } from 'howler';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

type SoundBank = {
  music: Howl;
  coin: Howl;
  hit: Howl;
  jump: Howl;
  crouch: Howl;
};

function playOneShot(sound: Howl) {
  sound.stop();
  sound.play();
}

export function AudioController() {
  const phase = useGameStore((state) => state.phase);
  const coinsCollected = useGameStore((state) => state.coinsCollected);
  const starsCollected = useGameStore((state) => state.starsCollected);
  const collisionCount = useGameStore((state) => state.collisionCount);
  const isJumping = useGameStore((state) => state.isJumping);
  const isSquatting = useGameStore((state) => state.isSquatting);

  const soundBankRef = useRef<SoundBank | null>(null);
  const audioUnlockedRef = useRef(false);
  const previousRef = useRef({
    coinsCollected,
    starsCollected,
    collisionCount,
    isJumping,
    isSquatting,
  });

  useEffect(() => {
    soundBankRef.current = {
      music: new Howl({
        src: ['/sounds/music.mp3', '/sounds/bgm.mp3', '/sounds/music.ogg'],
        loop: true,
        volume: 0.32,
        html5: true,
      }),
      coin: new Howl({
        src: ['/sounds/coin.mp3', '/sounds/coin.ogg', '/sounds/coin.wav'],
        volume: 0.56,
      }),
      hit: new Howl({
        src: ['/sounds/hit.mp3', '/sounds/hit.ogg', '/sounds/hit.wav'],
        volume: 0.68,
      }),
      jump: new Howl({
        src: ['/sounds/jump.mp3', '/sounds/jump.ogg', '/sounds/jump.wav'],
        volume: 0.54,
      }),
      crouch: new Howl({
        src: ['/sounds/crouch.mp3', '/sounds/crouch.ogg', '/sounds/crouch.wav'],
        volume: 0.5,
      }),
    };

    return () => {
      Object.values(soundBankRef.current ?? {}).forEach((sound) => sound.unload());
      soundBankRef.current = null;
    };
  }, []);

  useEffect(() => {
    function unlockAudio() {
      audioUnlockedRef.current = true;
      const music = soundBankRef.current?.music;

      if (
        music &&
        phase !== 'GAME_OVER' &&
        !music.playing()
      ) {
        music.play();
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [phase]);

  useEffect(() => {
    const music = soundBankRef.current?.music;
    if (!music || !audioUnlockedRef.current) {
      return;
    }

    const shouldPlayMusic = phase !== 'GAME_OVER';

    if (shouldPlayMusic) {
      if (!music.playing()) {
        music.play();
      }
    } else if (music.playing()) {
      music.stop();
    }
  }, [phase]);

  useEffect(() => {
    if (!audioUnlockedRef.current || !soundBankRef.current) {
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
    const sounds = soundBankRef.current;

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
