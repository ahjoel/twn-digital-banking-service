import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaymentStatusResponse } from './payment.models';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment-status',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './payment-status.html',
  styleUrl: './payment-status.scss',
})
export class PaymentStatusPage {
  private readonly payments = inject(PaymentService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    reference: [
      '',
      [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_-]+$/)],
    ],
  });

  protected readonly loading = signal(false);
  protected readonly result = signal<PaymentStatusResponse | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected check(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.payments.checkStatus(this.form.getRawValue().reference.trim()).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        // a 401 is handled by authInterceptor (sign out + redirect)
        this.errorMessage.set(
          error.status === 0
            ? 'Unable to reach the server. Please try again later.'
            : 'Unable to retrieve the payment status. Please try again.',
        );
      },
    });
  }

  protected get referenceInvalid(): boolean {
    const c = this.form.controls.reference;
    return c.invalid && (c.touched || c.dirty);
  }
}
