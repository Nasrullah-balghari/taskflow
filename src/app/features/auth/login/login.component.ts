import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  @ViewChild('passwordInput') private passwordInput!: ElementRef<HTMLInputElement>;

  readonly isLoading    = signal(false);
  readonly isSuccess    = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  onForgotPassword(): void {
    alert('Forgot password feature coming soon!');
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.form.disable();

    const { email, password, rememberMe } = this.form.getRawValue();
    const result = await this.auth.login({ email, password, rememberMe });

    if (result.success) {
      this.isSuccess.set(true);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      setTimeout(() => this.router.navigateByUrl(returnUrl), 400);
    } else {
      this.errorMessage.set(result.error ?? 'Login failed. Please try again.');
      // Clear password only, keep email for convenience
      this.f.password.setValue('');
      this.form.enable();
      this.isLoading.set(false);
      // Focus password field so user can retype immediately
      setTimeout(() => this.passwordInput?.nativeElement?.focus(), 50);
    }
  }
}
