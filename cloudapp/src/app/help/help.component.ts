  
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help',
  template: `
 
  <div class="eca-actions">
    <button mat-flat-button color="secondary" [routerLink]="['/']"><mat-icon>arrow_back</mat-icon>Back</button>
  </div>
  <div class="title">
    <h1>{{ 'HelpTitle' | translate }}</h1>
  </div>
  <div [innerHTML]="'HelpText' | translate"></div>
  `
})
export class HelpComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
