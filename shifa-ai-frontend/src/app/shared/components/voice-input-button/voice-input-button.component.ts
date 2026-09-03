import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageService } from '../../../core/services/language.service';
import { SpeechRecognitionService } from '../../../core/services/speech-recognition.service';

@Component({
  selector: 'app-voice-input-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './voice-input-button.component.html',
  styleUrl: './voice-input-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoiceInputButtonComponent {
  private readonly languageService = inject(LanguageService);
  private readonly speechRecognitionService = inject(SpeechRecognitionService);

  readonly transcriptRecognized = output<string>();

  readonly isListening = this.speechRecognitionService.isListening;
  readonly isSupported = this.speechRecognitionService.isSupported;

  toggleListening(): void {
    if (this.isListening()) {
      this.speechRecognitionService.stopListening();
      return;
    }

    this.speechRecognitionService.startListening(this.languageService.currentLanguage(), (transcript) =>
      this.transcriptRecognized.emit(transcript)
    );
  }
}
