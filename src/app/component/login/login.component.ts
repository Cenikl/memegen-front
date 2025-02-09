import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports:[CommonModule,ReactiveFormsModule],
  providers:[CookieService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;

  isLoginVisible: boolean = true;
  isForgotPasswordVisible: boolean = false;
  isResetPassword: boolean = false;
  username: string = "";

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private cookieService: CookieService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      username: ['', Validators.required],
    });

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required] 
    },{ 
        validator: this.passwordMatchValidator 
      });
  }

  onLogin() {
    if (this.loginForm.valid) {
      const username = this.loginForm.get('username')?.value;
      const password = this.loginForm.get('password')?.value;

      this.authService.login(username, password).subscribe({
        next: (response: any) => {
          const token = response.token;
          this.cookieService.set('auth_token', token, 1, '/');
          this.router.navigate(['/gallery']);
        },
        error: (err: any) => console.error('Login failed', err)
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  showForgotPasswordForm(): void {
    this.isForgotPasswordVisible = true;
    this.isLoginVisible = false;
    this.isResetPassword = false
  }

  showLoginForm(): void {
    this.isLoginVisible = true;
    this.isForgotPasswordVisible = false;
    this.isResetPassword = false;
  }

  showResetForm(): void {
    this.isLoginVisible = false;
    this.isForgotPasswordVisible = false;
    this.isResetPassword = true;
  }
  
  onSubmitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    const username = this.forgotPasswordForm.value.username;
 
    this.authService.findUser(username).subscribe({
      next: (response: any) => {
        if (response.exists) {
          this.username = username;
          this.showResetForm();
        } else {
          alert('User does not exist');
        }
      },
      error: (err: any) => {
        alert('Error checking username');
      }
    });
  }

  onSubmitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }
    const password = this.resetPasswordForm.value.password;
 
    this.authService.resetPassword(this.username,password).subscribe({
      next: (response: any) => {
        this.showLoginForm();
      },
      error: (err: any) => {
        alert('Error checking username');
      }
    });
  }

  passwordMatchValidator(group: FormGroup): null | { mismatch: boolean } {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }
}
