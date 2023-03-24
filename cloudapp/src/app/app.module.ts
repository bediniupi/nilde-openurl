
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule, getTranslateModule, AlertModule } from '@exlibris/exl-cloudapp-angular-lib';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';
import { HelpComponent } from './help/help.component';


export function getToastrModule() {
  return ToastrModule.forRoot({
    positionClass: 'toast-top-right',
    closeButton: true,
    extendedTimeOut: 0,
    timeOut: 0,
    tapToDismiss: false,
    enableHtml: true
  });
}
@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HelpComponent
  ],
  imports: [
    AlertModule,
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    getTranslateModule(),
    getToastrModule()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
