import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AlertService, CloudAppSettingsService, FormGroupUtil, CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings';
import { TranslateService } from '@ngx-translate/core';

//API CALL
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  settings: Settings;
  saving : boolean = false;
  instCode: string;
  lang: string;
  tabWF: string;
  BRStatus: {};
  
  constructor(
   private appService: AppService,
   private settingsService: CloudAppSettingsService,
   private eventsService: CloudAppEventsService,
   private alert: AlertService,
   private restService: CloudAppRestService,
   private translate: TranslateService
) {}
    
  ngOnInit() {

      this.settingsService.get().subscribe( settings => {

      this.eventsService.getInitData().subscribe( data => {
        if ( settings.brstatus === undefined) {
            this.settings = Object.assign(new Settings(), settings);
            this.instCode = data.instCode;
            this.lang = data.lang;
            this.tabWF = "/almaws/v1/conf/code-tables/MandatoryBorrowingWorkflowSteps?lang="+this.lang+"&scope="+data.instCode;
            //console.log("URL: ", this.tabWF);
            this.restService.call(this.tabWF).subscribe(
                BRStatus => {
                    BRStatus.row = this.sortAlpha(BRStatus.row);
                    this.settings['brstatus'] = Object.assign(BRStatus.row);

                    for (let key in this.settings['brstatus']) {
                    this.settings['brstatus'][key]['visibility'] = true;
                    if ( this.settings['brstatus'][key]['active'] === undefined ) this.settings['brstatus'][key]['active'] = false;
                    
                    if ( this.settings['brstatus'][key]['enabled'] == false ) { 
                        this.settings['brstatus'][key]['visibility'] = false;
                    }

                    // enabled by default, not visible in settings
                    if ( this.settings['brstatus'][key]['code'] == "REQUEST_CREATED_BOR" || this.settings['brstatus'][key]['code'] == "READY_TO_SEND" ) {
                        this.settings['brstatus'][key]['visibility'] = false;
                        this.settings['brstatus'][key]['active'] = true;
                    }
                    
                 }
  
               });

            }  else {

          this.settings = settings as Settings;
        }               
            
        })

    });

 }
 
  activateStatus(settingsCode : string) {
   
    for (var key in this.settings['brstatus']) {

        if ( this.settings['brstatus'][key]['code'] == settingsCode ) {
           
            this.settings['brstatus'][key]['active'] = !(this.settings['brstatus'][key]['active']);
           
        // save settings automatically
        this.save();
            return;
        } 
        
    }
    
 }

 save() {
    this.saving = true;
    console.log("Settings saved:",this.settings);
    this.settingsService.set(this.settings).subscribe(
      response => {
        this.alert.success(this.translate.instant('SaveSuccess'));
      },
      err => this.alert.error(err.message),
      ()  => this.saving = false
    );
  }

  remove() {
    this.saving = true;
    console.log("App removing settings...");
     this.settingsService.remove().subscribe( response => {
       this.alert.success(this.translate.instant('ResetMsg'));
       console.log("removed");
     },
     err => this.alert.error(err.message),
     ()  => this.saving = false
    );
  }

// filter for ngFor
  noVisibility(code: any[]): any[] {
    return code.filter(p => p.visibility === true);
   }

// applying sorting array alphabetically typescript style (to avoid property sort not exists error)
  sortAlpha(array: Readonly<Array<any>>) {
    return [...array].sort((a, b) => a.description.toUpperCase().localeCompare(b.description.toUpperCase()));
    }

}


