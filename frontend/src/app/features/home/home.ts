import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Welcome, {{ auth.username() }}</h1>
    <p>You are signed in as <strong>{{ auth.role() }}</strong>.</p>
    <p><a routerLink="/payments/status">Check a payment status</a></p>
  `,
})
export class Home {
  protected readonly auth = inject(AuthService);
}
