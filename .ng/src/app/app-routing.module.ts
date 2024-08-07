import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { HelpComponent } from './help/help.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'help', component: HelpComponent},
  { path: 'settings', component: SettingsComponent } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
