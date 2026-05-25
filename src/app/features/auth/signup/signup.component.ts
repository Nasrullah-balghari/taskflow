import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const passwordMatchValidator: ValidatorFn =
  (group: AbstractControl): ValidationErrors | null => {
    const pass    = group.get('password')?.value as string;
    const confirm = group.get('confirmPassword')?.value as string;
    return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
  };

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading           = signal(false);
  readonly isSuccess           = signal(false);
  readonly errorMessage        = signal('');
  readonly showPassword        = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordMatchValidator });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword():        void { this.showPassword.update(v => !v); }
  toggleConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.form.disable();

    const { name, email, password, confirmPassword } = this.form.getRawValue();
    const result = await this.auth.signup({ name, email, password, confirmPassword });

    if (result.success) {
      this.isSuccess.set(true);
      setTimeout(() => this.router.navigate(['/dashboard']), 500);
    } else {
      this.errorMessage.set(result.error ?? 'Signup failed. Please try again.');
      // Clear passwords for security on error
      this.f.password.setValue('');
      this.f.confirmPassword.setValue('');
      this.form.enable();
      this.isLoading.set(false);
    }
  }
}
