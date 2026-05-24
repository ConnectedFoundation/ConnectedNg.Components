import { Component, inject, input } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';

export interface NotificationData {
  message: string;
  type: NotificationType;
  animated?: boolean;
}

export enum NotificationType {
  Info,
  Success,
  Error
}

@Component({
  selector: 'cn-notification',
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification {
  readonly snackBarRef = inject(MatSnackBarRef<Notification>);
  readonly data = inject<NotificationData>(MAT_SNACK_BAR_DATA);
  readonly NotificationType = NotificationType;

  message = input<string>(this.data.message);
  type = input<NotificationType>(this.data.type);
}
