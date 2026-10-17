import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { finalize, map, merge } from 'rxjs';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { VoiceInputButtonComponent } from '../../shared/components/voice-input-button/voice-input-button.component';
import { NormalizedHttpError } from '../../core/interceptors/error.interceptor';
import {
  TriageAgeGroup,
  TriageConditionId,
  TriageRedFlagId,
  TriageRequest,
  TriageSex,
} from '../../core/models/triage.model';
import { LanguageService } from '../../core/services/language.service';
import { SymptomApiService } from '../../core/services/symptom-api.service';
import { TriageStateService } from './triage-state.service';
import { TRIAGE_TEXT } from './triage-text';

const AGE_GROUPS: TriageAgeGroup[] = ['infant', 'child', 'adult', 'elderly'];
const SEXES: TriageSex[] = ['male', 'female', 'other'];
const CONDITION_IDS: TriageConditionId[] = ['diabetes', 'heart_disease', 'hypertension'];
const RED_FLAG_IDS: TriageRedFlagId[] = [
  'chest_pain',
  'breathing_difficulty',
  'confusion',
  'fainting',
  'seizure',
  'severe_bleeding',
  'stiff_neck_with_fever',
  'blood_in_vomit_or_stool',
  'stroke_signs',
  'infant_not_feeding',
  'severe_dehydration',
  'pregnancy_with_bleeding_or_severe_pain',
  'suicidal_thoughts',
];
const MAX_COMPLAINT_LENGTH = 2000;
const MAX_DURATION_DAYS = 365;
const MAX_OTHER_CONDITIONS_LENGTH = 200;

type CheckboxGroup<Id extends string> = FormGroup<Record<Id, FormControl<boolean>>>;

function buildCheckboxGroup<Id extends string>(ids: Id[]): CheckboxGroup<Id> {
  const controls = Object.fromEntries(ids.map((id) => [id, new FormControl(false, { nonNullable: true })]));
  return new FormGroup(controls as Record<Id, FormControl<boolean>>);
}

function isAnyTicked(group: AbstractControl): boolean {
  return Object.values((group.value ?? {}) as Record<string, boolean>).some(Boolean);
}

function requireNoneOrChoice(choicesKey: string): (group: AbstractControl) => ValidationErrors | null {
  return (group) => {
    const choices = group.get(choicesKey);
    const isNoneTicked = group.get('none')?.value === true;
    return isNoneTicked || (choices !== null && isAnyTicked(choices)) ? null : { noneOrChoiceRequired: true };
  };
}

function setControlAvailability(control: AbstractControl, isAvailable: boolean, resetValue: unknown): void {
  if (isAvailable && control.disabled) {
    control.markAsUntouched();
    control.enable({ emitEvent: false });
  } else if (!isAvailable && control.enabled) {
    control.reset(resetValue, { emitEvent: false });
    control.disable({ emitEvent: false });
  }
}

@Component({
  selector: 'app-triage-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSliderModule,
    MatStepperModule,
    MatToolbarModule,
    BackButtonComponent,
    LanguageSwitcherComponent,
    LoadingIndicatorComponent,
    UserMenuComponent,
    VoiceInputButtonComponent,
  ],
  templateUrl: './triage-form.component.html',
  styleUrl: './triage-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageFormComponent {
  private readonly symptomApiService = inject(SymptomApiService);
  private readonly triageStateService = inject(TriageStateService);
  private readonly router = inject(Router);
  protected readonly languageService = inject(LanguageService);

  protected readonly ageGroups = AGE_GROUPS;
  protected readonly sexes = SEXES;
  protected readonly conditionIds = CONDITION_IDS;
  protected readonly maxComplaintLength = MAX_COMPLAINT_LENGTH;

  protected readonly text = computed(() => TRIAGE_TEXT[this.languageService.currentLanguage()]);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false }
  );

  protected readonly patientGroup = new FormGroup({
    ageGroup: new FormControl<TriageAgeGroup | null>(null, Validators.required),
    sex: new FormControl<TriageSex | null>(null, Validators.required),
    isPregnant: new FormControl<boolean | null>({ value: null, disabled: true }, Validators.required),
  });

  protected readonly problemGroup = new FormGroup({
    mainComplaint: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(MAX_COMPLAINT_LENGTH)],
    }),
    durationDays: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_DURATION_DAYS),
      Validators.pattern(/^\d+$/),
    ]),
    severity: new FormControl<number | null>(null, Validators.required),
  });

  protected readonly warningSignsGroup = new FormGroup(
    {
      flags: buildCheckboxGroup(RED_FLAG_IDS),
      none: new FormControl(false, { nonNullable: true }),
    },
    { validators: requireNoneOrChoice('flags') }
  );

  protected readonly backgroundGroup = new FormGroup(
    {
      choices: buildCheckboxGroup<TriageConditionId | 'other'>([...CONDITION_IDS, 'other']),
      otherText: new FormControl(
        { value: '', disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_OTHER_CONDITIONS_LENGTH)],
        }
      ),
      none: new FormControl(false, { nonNullable: true }),
    },
    { validators: requireNoneOrChoice('choices') }
  );

  protected readonly conditionChoicesGroup = this.backgroundGroup.controls.choices;
  protected readonly otherConditionsControl = this.backgroundGroup.controls.otherText;
  protected readonly noConditionsControl = this.backgroundGroup.controls.none;
  protected readonly maxOtherConditionsLength = MAX_OTHER_CONDITIONS_LENGTH;

  protected readonly redFlagsGroup = this.warningSignsGroup.controls.flags;
  protected readonly noneOfTheseControl = this.warningSignsGroup.controls.none;
  protected readonly mainComplaintControl = this.problemGroup.controls.mainComplaint;
  protected readonly durationDaysControl = this.problemGroup.controls.durationDays;
  protected readonly severityControl = this.problemGroup.controls.severity;

  protected readonly showPregnancyQuestion = signal(false);
  protected readonly visibleRedFlagIds = signal<TriageRedFlagId[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly submissionError = signal<string | null>(null);

  constructor() {
    const { ageGroup, sex, isPregnant } = this.patientGroup.controls;

    merge(ageGroup.valueChanges, sex.valueChanges, isPregnant.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.syncConditionalQuestions());

    this.linkExclusiveNoneOption(this.noneOfTheseControl, this.redFlagsGroup, this.warningSignsGroup);
    this.linkExclusiveNoneOption(this.noConditionsControl, this.conditionChoicesGroup, this.backgroundGroup);

    this.syncConditionalQuestions();
  }

  private linkExclusiveNoneOption(noneControl: FormControl<boolean>, choices: AbstractControl, parent: AbstractControl): void {
    noneControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((isNoneTicked) => {
      if (isNoneTicked) {
        choices.reset(undefined, { emitEvent: false });
        this.syncOtherConditionsInput();
        parent.updateValueAndValidity();
      }
    });

    choices.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (isAnyTicked(choices) && noneControl.value) {
        noneControl.setValue(false, { emitEvent: false });
      }
      this.syncOtherConditionsInput();
    });
  }

  private syncOtherConditionsInput(): void {
    setControlAvailability(this.otherConditionsControl, this.conditionChoicesGroup.controls.other.value, '');
  }

  protected advance(stepper: MatStepper, group: AbstractControl): void {
    group.markAllAsTouched();
    if (group.valid) {
      stepper.next();
    }
  }

  protected onTranscriptRecognized(transcript: string): void {
    this.mainComplaintControl.setValue(transcript);
    this.mainComplaintControl.markAsTouched();
  }

  protected submit(): void {
    const allGroups = [this.patientGroup, this.problemGroup, this.warningSignsGroup, this.backgroundGroup];
    allGroups.forEach((group) => group.markAllAsTouched());

    if (allGroups.some((group) => group.invalid) || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submissionError.set(null);

    this.symptomApiService
      .triage(this.buildRequest())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.triageStateService.setResponse(response);
          this.router.navigate(['/triage/result']);
        },
        error: (error: NormalizedHttpError) => {
          this.submissionError.set(error.message);
        },
      });
  }

  private buildRequest(): TriageRequest {
    const { ageGroup, sex, isPregnant } = this.patientGroup.controls;
    const tickedRedFlags = this.noneOfTheseControl.value
      ? []
      : RED_FLAG_IDS.filter((id) => this.redFlagsGroup.controls[id].enabled && this.redFlagsGroup.controls[id].value);

    return {
      ageGroup: ageGroup.value as TriageAgeGroup,
      sex: sex.value as TriageSex,
      ...(isPregnant.enabled ? { isPregnant: isPregnant.value === true } : {}),
      mainComplaint: this.mainComplaintControl.value.trim(),
      durationDays: Number(this.durationDaysControl.value),
      severity: Number(this.severityControl.value),
      redFlags: tickedRedFlags,
      conditions: CONDITION_IDS.filter((id) => this.conditionChoicesGroup.controls[id].value),
      ...(this.otherConditionsControl.enabled ? { otherConditions: this.otherConditionsControl.value.trim() } : {}),
      language: this.languageService.currentLanguage(),
    };
  }

  private syncConditionalQuestions(): void {
    const { ageGroup, sex, isPregnant } = this.patientGroup.controls;
    const isAdultFemale = ageGroup.value === 'adult' && sex.value === 'female';

    setControlAvailability(isPregnant, isAdultFemale, null);
    this.showPregnancyQuestion.set(isAdultFemale);

    setControlAvailability(this.redFlagsGroup.controls.infant_not_feeding, ageGroup.value === 'infant', false);
    setControlAvailability(
      this.redFlagsGroup.controls.pregnancy_with_bleeding_or_severe_pain,
      isAdultFemale && isPregnant.value === true,
      false
    );
    this.warningSignsGroup.updateValueAndValidity();

    this.visibleRedFlagIds.set(RED_FLAG_IDS.filter((id) => this.redFlagsGroup.controls[id].enabled));
  }
}
