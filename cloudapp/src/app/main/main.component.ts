import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ɵɵresolveBody } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  CloudAppRestService, CloudAppEventsService, Request, HttpMethod,
  Entity, PageInfo, RestErrorResponse, AlertService
} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private pageLoad$: Subscription;
  pageEntities: Entity[];
  private _apiResult: any;
  hasRSRequest : boolean = false;
  chooseFromList : boolean = false;
  changeLog : string;
  link: string;
  title:string;
  hasApiResult: boolean = false;
  toNilde: boolean = true;
  loading: boolean = false;
  requestSent: boolean[] = [true, false];
    
  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService, 
    private translate: TranslateService,
    private alert : AlertService) { }

  ngOnInit() {
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
       console.log('choose From List ' + (this.pageEntities || []).length );
       this.chooseFromList = true;
    } else if ((this.pageEntities || []).length == 1  && this.pageEntities[0].type === 'BORROWING_REQUEST') {
       console.log('title ' + this.title);
      this.onLoadEntity(pageInfo.entities[0]);
    } 
  }

  onLoadEntity(entity : Entity){
      this.hasRSRequest = true;
      this.link = entity.link;
      console.log('Sending API GET request ' + this.link );
      this.restService.call(entity.link).subscribe(result => {
        this.apiResult = result;
        console.log(result);
        if(result['status']['value'] === 'READY_TO_SEND' || result['status']['value'] === 'REQUEST_CREATED_BOR'){
          this.toNilde = true;
          this.title = this.requestView(result);
        }else{
          this.toNilde = false;
          this.title = this.translate.instant('RequestNoNilde') + "<br />Status: "+ result['status']['desc'];
         }
      });
  }
  
  requestView(request: any) {
    var requestString = this.translate.instant("RequestRetrieved");
    const reqid = request['request_id'];
    
    if (this.requestSent[reqid]) requestString = "<strong>" + this.translate.instant('AlreadySent') + "</strong><br />" + requestString;
    
    
    var reqData = {};
    reqData['title'] = this.translate.instant("TitleTag");
    reqData['author'] = this.translate.instant("AuthorTag");
    reqData['year'] = this.translate.instant("YearTag");
    reqData['journal_title'] = this.translate.instant("JournalTag");
    reqData['pages'] = this.translate.instant("PagesTag");
    reqData['volume'] = this.translate.instant("VolumeTag");
    reqData['issue'] = this.translate.instant("IssueTag");
    reqData['issn'] = "ISSN: ";
    reqData['isbn'] = "ISBN: ";
    
    Object.keys(request).forEach(key => {
        if (key in reqData && request[key] !== "") requestString += "<br />"+reqData[key]+request[key];
     });
     requestString += "<br />"+this.translate.instant("RequesterTag")+request["requester"]['desc']+" ("+request["requester"]["value"]+")";
     console.log("RequestString = "+requestString);
    return requestString;
  }
  
  almaRS2OpenUrl(value: any) {
    const ouBasePar = "url_ver=Z39.88-2004&url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx&url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx";
    var ouMap = {};
    ouMap['author'] = "rft.au=";
    ouMap['author_initials'] = "rft.auinit=";
    ouMap['title'] = "rft.atitle=";
    
    if (value['journal_title'] === "") ouMap['title'] = "rft.title=";

    ouMap['journal_title'] = "rft.jtitle=";
    ouMap['year'] = "rft.date=";
    ouMap['volume'] = "rft.volume=";
    ouMap['issue'] = "rft.issue=";
    ouMap['pages'] = "rft.pages=";
    ouMap['start_page'] = "rft.spage=";
    ouMap['end_page'] = "rft.epage=";
    ouMap['issn'] = "rft.issn=";
    ouMap['isbn'] = "rft.isbn=";
    ouMap['publisher'] = "rft.pub=";
    ouMap['place_of_publication'] = "rft.place=";
    ouMap['doi'] = "rft_id=info:doi/";
    ouMap['pmid'] = "rft_id=info:pmid/";
           
    var ouParams = encodeURI(ouBasePar);
    Object.keys(value).forEach(key => {
        if (key in ouMap && value[key] !== "") ouParams += "&"+encodeURI(ouMap[key]+value[key]);
     });
     
     console.log("ouparams: "+ouParams);
     
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
