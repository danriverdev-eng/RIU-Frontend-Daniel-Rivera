import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { HeroService } from '../../../../core/services/hero.service';
import { HeroCreateDto, HeroUpdateDto, HeroStatus } from '../../../../core/models/hero.model';
import { UppercaseDirective } from '../../../../shared/directives/uppercase.directive';

type HeroFormControls = {
  name: FormControl<string>;
  realName: FormControl<string>;
  powers: FormControl<string>;
  universe: FormControl<string>;
  status: FormControl<HeroStatus>;
};

const trimmedRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

const trimmedMinimumLength = (minimumLength: number): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value !== 'string' || control.value.trim().length === 0) {
      return null;
    }

    const actualLength = control.value.trim().length;
    return actualLength >= minimumLength
      ? null
      : { minlength: { requiredLength: minimumLength, actualLength } };
  };

const commaSeparatedPowers: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (typeof control.value !== 'string' || control.value.trim().length === 0) {
    return { required: true };
  }

  const powers = control.value.split(',').map((power: string) => power.trim());
  if (powers.every((power: string) => power.length === 0)) {
    return { required: true };
  }

  return powers.every((power: string) => power.length > 0) ? null : { powersFormat: true };
};

@Component({
  selector: 'app-hero-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    UppercaseDirective
  ],
  templateUrl: './hero-form-page.component.html',
  styleUrls: ['./hero-form-page.component.scss']
})
export class HeroFormPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly heroService = inject(HeroService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  heroForm!: FormGroup<HeroFormControls>;
  isEditMode = false;
  heroId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  loadFailed = false;

  ngOnInit(): void {
    this.initForm();
    this.heroId = this.route.snapshot.paramMap.get('id');

    if (this.heroId) {
      this.isEditMode = true;
      this.loadHeroData(this.heroId);
    }
  }

  private initForm(): void {
    this.heroForm = this.fb.group({
      name: ['', [trimmedRequired, trimmedMinimumLength(3)]],
      realName: ['', [trimmedRequired]],
      powers: ['', [commaSeparatedPowers]],
      universe: this.fb.control('Marvel', { validators: [trimmedRequired] }),
      status: this.fb.control<HeroStatus>('Active', { validators: [Validators.required] })
    });
  }

  private loadHeroData(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.heroService.getHeroById(id).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (hero) => {
        this.heroForm.patchValue({
          name: hero.name,
          realName: hero.realName,
          powers: hero.powers.join(', '),
          universe: hero.universe,
          status: hero.status
        });
      },
      error: () => {
        this.loadFailed = true;
        this.errorMessage = 'Error al cargar los datos del súper héroe. Vuelve a intentarlo.';
      }
    });
  }

  onSubmit(): void {
    if (this.isLoading || this.isSubmitting || this.loadFailed) {
      return;
    }

    if (this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    const heroData = this.toCreateDto();
    const request$ = this.isEditMode && this.heroId
      ? this.heroService.updateHero(this.heroId, this.toUpdateDto(heroData))
      : this.heroService.createHero(heroData);

    request$.pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: (hero) => {
        this.showNotification(this.isEditMode
          ? 'Súper héroe actualizado con éxito'
          : 'Súper héroe registrado con éxito');
        this.router.navigate(['/heroes'], this.isEditMode
          ? undefined
          : { state: { createdHeroId: hero.id } });
      },
      error: () => {
        this.errorMessage = this.isEditMode
          ? 'Error al actualizar el súper héroe. Vuelve a intentarlo.'
          : 'Error al crear el súper héroe. Vuelve a intentarlo.';
      }
    });
  }

  private toCreateDto(): HeroCreateDto {
    const value = this.heroForm.getRawValue();
    return {
      name: value.name.trim().toUpperCase(),
      realName: value.realName.trim(),
      powers: value.powers.split(',').map((power: string) => power.trim()),
      universe: value.universe.trim(),
      status: value.status
    };
  }

  private toUpdateDto(dto: HeroCreateDto): HeroUpdateDto {
    return {
      name: dto.name,
      realName: dto.realName,
      powers: [...dto.powers],
      universe: dto.universe,
      status: dto.status
    };
  }

  onCancel(): void {
    this.router.navigate(['/heroes']);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}
