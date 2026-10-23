import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PaymentStatusPage } from './payment-status';

describe('PaymentStatusPage', () => {
  let httpMock: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [PaymentStatusPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PaymentStatusPage);
    fixture.detectChanges();
    return fixture;
  }

  function search(fixture: ReturnType<typeof setup>, reference: string) {
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#reference')!;
    input.value = reference;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('does not call the API for an invalid reference', () => {
    const fixture = setup();
    search(fixture, 'PAY 1; DROP TABLE');
    httpMock.expectNone(() => true);
  });

  it('displays the payment status returned by the API', () => {
    const fixture = setup();
    search(fixture, 'PAY-2026-0001');

    const req = httpMock.expectOne(
      (r) => r.url === '/api/payments/check-status' && r.params.get('reference') === 'PAY-2026-0001',
    );
    req.flush({
      reference: 'PAY-2026-0001',
      transactionId: 'TXN-1',
      status: 'PENDING',
      statusDescription: 'Payment is being processed',
      amount: 150000,
      currency: 'XOF',
      debtorAccount: 'A',
      creditorAccount: 'B',
      creditorName: 'Sample Merchant Ltd',
      paymentMethod: 'TRANSFER',
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:05:00Z',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge')?.textContent).toContain('PENDING');
    expect(el.querySelector('.badge')?.classList).toContain('badge--pending');
    expect(el.textContent).toContain('Payment is being processed');
  });

  it('shows an error message when the request fails', () => {
    const fixture = setup();
    search(fixture, 'PAY-1');
    httpMock
      .expectOne((r) => r.url === '/api/payments/check-status')
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to retrieve the payment status',
    );
  });
});
