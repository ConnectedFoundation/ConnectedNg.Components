import { inject, Injectable } from "@angular/core";
import { Notification, NotificationType } from "./notification/notification";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Success, message }
    });
  }

  error(message: string): void {
    this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Error, message }
    });
  }

  info(message: string): void {
    this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Info, message }
    });
  }
}