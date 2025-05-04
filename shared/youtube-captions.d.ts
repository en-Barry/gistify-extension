declare module 'youtube-captions-scraper' {
  export interface CaptionItem {
    text: string;
    start: number;
    dur: number;
  }

  export interface GetSubtitlesOptions {
    videoID: string;
    lang?: string;
  }

  export function getSubtitles(options: GetSubtitlesOptions): Promise<CaptionItem[]>;
}
