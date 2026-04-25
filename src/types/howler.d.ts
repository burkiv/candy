declare module 'howler' {
  export interface HowlOptions {
    src: string | readonly string[];
    volume?: number;
    loop?: boolean;
    html5?: boolean;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(id?: number | string): number;
    stop(id?: number): this;
    unload(): void;
    playing(id?: number): boolean;
    volume(): number;
    volume(volume: number, id?: number): this;
  }
}
