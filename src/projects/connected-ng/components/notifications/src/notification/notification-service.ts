import { inject, Injectable } from "@angular/core";
import { Notification, NotificationType } from "./notification/notification";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Success, message },
      duration: 3000
    });
  }

  error(message: string): void {
    this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Error, message },
      duration: 3000
    });
  }

  info(message: string, duration = 3000): MatSnackBarRef<Notification> {
    return this.snackBar.openFromComponent(Notification, {
      data: { type: NotificationType.Info, message },
      duration
    });
  }
}