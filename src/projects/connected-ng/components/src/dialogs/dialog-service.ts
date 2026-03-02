import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialog } from "../public-api";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class DialogService {
  readonly dialog = inject(MatDialog);

  confirm(title: string, message: string): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: { title, message }
    });

    return dialogRef.afterClosed();
  }
}