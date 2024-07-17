import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  CloudAppRestService, CloudAppEventsService, Request, HttpMethod,
  Entity, PageInfo, RestErrorResponse, AlertService, CloudAppSettingsService
} from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private pageLoad$: Subscription;
  pageEntities: Entity[];
  settings: Settings;
  private _apiResult: any;
  hasRSRequest : boolean = false;
  chooseFromList : boolean = false;
  changeLog : string;
  link: string;
  title:string;
  hasApiResult: boolean = false;
  toNilde: boolean = false;
  loading: boolean = false;
  requestSent: boolean[] = [true, false];
    
  constructor(
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService,
    private eventsService: CloudAppEventsService, 
    private translate: TranslateService,
    private alert : AlertService,

) { }

  ngOnInit() {
    this.settingsService.get().subscribe(settings => {
        this.settings = settings as Settings;
                   // console.log('This settings :', settings);
        if( this.settings['brstatus'] === undefined) {
          console.log('No Settings configured')
            this.settings = new Settings();
           // console.log('This settings 2:', this.settings);
       }
    
    })
        
    this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
   }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  get apiResult() {
    return this._apiResult;
  }

  
  set apiResult(result: any) {
    this._apiResult = result;
    this.hasApiResult = result && Object.keys(result).length > 0;
  }

  onPageLoad = (pageInfo: PageInfo) => {
    this.title = "";
    this.apiResult = {};
    this.loading = false;
    this.chooseFromList = false;
    this.pageEntities = pageInfo.entities;
    this.hasRSRequest = false;
    if ((this.pageEntities || []).length > 1 && this.pageEntities[0].type === 'BORROWING_REQUEST') {
       //list of Borrowing Requests
       //console.log('choose From List ' + (this.pageEntities || []).length );
       this.chooseFromList = true;

    } else if ((this.pageEntities || []).length == 1  && this.pageEntities[0].type === 'BORROWING_REQUEST') {
       // console.log('title ' + this.title);
      this.onLoadEntity(pageInfo.entities[0]);
    } 
   
    

  }

  onLoadEntity(entity : Entity){
      this.hasRSRequest = true;
      this.link = entity.link;
      this.restService.call(entity.link).subscribe(result => {
        this.apiResult = result;
        this.toNilde = false;
        this.title = "<strong>" + this.translate.instant('RequestNoNilde') + "</strong><br />Status: "+ result['status']['desc'];
        
        for (var key in this.settings['brstatus']) {
            if (result['status']['value'] == this.settings['brstatus'][key]['code'])  {
                if (this.settings['brstatus'][key]['active'] === true) {
                    this.toNilde = true;
                    this.title = this.requestView(result);
                } 
            break;
            }
       }
             
    });
  }
  
  requestView(request: any) {
    var requestString = this.translate.instant("RequestRetrieved");
    const reqid = request['request_id'];
    
    if (this.requestSent[reqid]) requestString = "<strong>" + this.translate.instant('AlreadySent') + "</strong><br />" + requestString;
   
    if (request['chapter']) request['chapter_title'] = (request['chapter'] + " " + request['chapter_title']).trim();
    request['genre'] = "journal";
    if (request['citation_type']['value'] == "BK") request['genre'] = "book";
    
    var reqData = {};
    reqData['title'] = this.translate.instant("TitleTag");
    reqData['author'] = this.translate.instant("AuthorTag");
    reqData['year'] = this.translate.instant("YearTag");
    reqData['journal_title'] = this.translate.instant("JournalTag");
    reqData['chapter_title'] = this.translate.instant("ChapterTag");
    reqData['pages'] = this.translate.instant("PagesTag");
    reqData['volume'] = this.translate.instant("VolumeTag");
    reqData['issue'] = this.translate.instant("IssueTag");
    reqData['issn'] = "ISSN: ";
    reqData['isbn'] = "ISBN: ";
    
    Object.keys(request).forEach(key => {
        if (key in reqData && request[key] !== "") requestString += "<br />"+reqData[key]+request[key];
     });
     requestString += "<br />"+this.translate.instant("RequesterTag")+request["requester"]['desc']+" ("+request["requester"]["value"]+")";
    return requestString;
  }
  
  almaRS2OpenUrl(value: any) {
    
    const ouBasePar = "url_ver=Z39.88-2004&url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx";
    var ouMap = {};
    ouMap['genre'] = "rft_val_fmt=info:ofi/fmt:kev:mtx:";
    ouMap['author'] = "rft.au=";

    // Nilde bug: rft.auinit overwrite rft.au
    if (value['author'] && value['author_initials']) {
        value['author']+=" "+value['author_initials'];
     }

    ouMap['title'] = "rft.atitle=";
    
    if (value['journal_title'] === "") ouMap['title'] = "rft.btitle=";

    ouMap['chapter_title'] = "rft.atitle=";
    ouMap['journal_title'] = "rft.jtitle=";
    ouMap['year'] = "rft.date=";
    ouMap['volume'] = "rft.volume=";
    ouMap['issue'] = "rft.issue=";
    ouMap['pages'] = "rft.pages=";
    
    if (value['pages'] && !(value['start_page'] || value['end_page'])) {
        var sep = value['pages'].indexOf('-'); 
        const pageArray = [value['pages'].slice(0,sep), value['pages'].slice(sep+1)];
        value['start_page'] = pageArray[0].trim();
        value['end_page'] = pageArray[1].trim();
        }
    
    ouMap['start_page'] = "rft.spage=";
    ouMap['end_page'] = "rft.epage=";
    ouMap['issn'] = "rft.issn=";
    ouMap['isbn'] = "rft.isbn=";
    ouMap['publisher'] = "rft.pub=";
    ouMap['place_of_publication'] = "rft.place=";
    ouMap['doi'] = "rft_id=info:doi/";
    ouMap['pmid'] = "rft_id=info:pmid/";
        
    var ouParams = encodeURIComponent(ouBasePar);
    Object.keys(value).forEach(key => {
        if (key in ouMap && value[key] !== "") ouParams += "&"+encodeURIComponent(ouMap[key]+this.cleanData(value[key], key));
     });
     
     return ouParams;
}
  
  inviaNilde(){
    this.loading = true;
    const _body = { ...this.apiResult };
    this.invia(_body);
    
  }
  
  invia(value: any) {
    const nildeOpenurl = "https://nilde.bo.cnr.it/openurlresolver.php?" + this.almaRS2OpenUrl(value);
    console.log("OpenUrl Nilde: "+nildeOpenurl);
    window.open(nildeOpenurl, "NildeOpenurl");
    var reqid = value['request_id'];
    var titlemsg = this.translate.instant("RequestSent")+"<br />" + this.translate.instant("UpdateManually");
    if (this.requestSent[reqid]) titlemsg = this.translate.instant("RequestAlreadySent")+ "<br />" + this.translate.instant("UpdateManually");
    
    this.title = titlemsg;
    this.toNilde = false;
    this.loading = false;
    
    this.requestSent[reqid] = true;
    // this.refreshPage();
  }
    
  cleanData (textdata: any, key: string) {
    const clArray = ['title', 'author', 'publisher', 'chapter_title', 'journal_title', 'place_of_publication'];
    const qtArray = ['title', 'journal_title', 'chapter_title'];
    var cleanText = textdata;
    // in Nilde's titles fields a single quotation mark is not allowed, substituded with a Right single quotation mark (U+2019), same for brackets
    if (qtArray.includes(key)) cleanText = cleanText.replace(/'/g, "’").replace(/\[/g, "［ ").replace(/\]/g, "］");
    // & needs to be encoded in all text fields
    if (clArray.includes(key)) return cleanText.replace(/&/g, "%26")
    return cleanText;
  }  
  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  refreshPage = () => {
    this.loading = true;
    this.eventsService.refreshPage().subscribe({
      error: e => {
        console.error(e);
        this.alert.error(this.translate.instant('RefreshFailed'));
      },
      complete: () => this.loading = false
    });
  }

  backPage = () => {
    this.loading = true;
    this.eventsService.back().subscribe({
      error: e => {
        console.error(e);
        this.alert.error(this.translate.instant('BackFailed'));
      },
      complete: () => this.loading = false
    });
  }

}
