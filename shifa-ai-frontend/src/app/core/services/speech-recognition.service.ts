import { Injectable, NgZone, inject, signal } from '@angular/core';
import { AppLanguage } from '../models/health-response.model';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const LANGUAGE_TO_RECOGNITION_LOCALE: Record<AppLanguage, string> = {
  en: 'en-US',
  ur: 'ur-PK',
  pa: 'ur-PK',
};

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private readonly ngZone = inject(NgZone);
  private readonly recognitionConstructor = this.resolveRecognitionConstructor();
  private recognitionInstance: SpeechRecognitionInstance | null = null;

  readonly isListening = signal(false);
  readonly isSupported = signal(this.recognitionConstructor !== undefined);

  startListening(
    language: AppLanguage,
    onResult: (transcript: string) => void,
    onError?: (message: string) => void
  ): void {
    if (!this.recognitionConstructor || this.isListening()) {
      return;
    }

    const recognition = new this.recognitionConstructor();
    recognition.lang = LANGUAGE_TO_RECOGNITION_LOCALE[language];
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      this.ngZone.run(() => onResult(transcript));
    };

    recognition.onerror = (event) => {
      this.ngZone.run(() => {
        this.isListening.set(false);
        onError?.(event.error);
      });
    };

    recognition.onend = () => {
      this.ngZone.run(() => this.isListening.set(false));
    };

    this.recognitionInstance = recognition;
    this.isListening.set(true);
    recognition.start();
  }

  stopListening(): void {
    this.recognitionInstance?.stop();
    this.isListening.set(false);
  }

  private resolveRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return window.SpeechRecognition ?? window.webkitSpeechRecognition;
  }
}
