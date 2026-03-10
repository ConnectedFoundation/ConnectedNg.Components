import { NgTemplateOutlet } from '@angular/common';
import { Component, input, TemplateRef } from '@angular/core';

@Component({
  selector: 'cf-code-list-edit-form',
  imports: [NgTemplateOutlet],
  templateUrl: './code-list-edit-form.html',
  styleUrl: './code-list-edit-form.scss',
})
export class CodeListEditForm {
  editTemplate = input<TemplateRef<any> | undefined>();
  templateContext = input<any>();
}
