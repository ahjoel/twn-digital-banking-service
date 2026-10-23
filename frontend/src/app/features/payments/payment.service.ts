import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentStatusResponse } from './payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  /** The Bearer token is added by authInterceptor. */
  checkStatus(reference: string): Observable<PaymentStatusResponse> {
    const params = new HttpParams().set('reference', reference);
    return this.http.get<PaymentStatusResponse>('/api/payments/check-status', { params });
  }
}
